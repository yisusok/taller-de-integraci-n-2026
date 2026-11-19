import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsWhere,
  QueryRunner,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { ManualExtractionDto } from './dto/manual-extraction.dto';
import { TipoMovimiento } from './enums/tipo-movimiento.enum';

export interface StockSummary {
  variante_id: string;
  existencias_actuales: number;
  total_ingresos: number;
  total_ventas: number;
  total_extracciones_manuales: number;
}

export type NivelAlertaStock = 'agotado' | 'critico' | 'bajo';

export interface LowStockAlert {
  variante_id: string;
  existencias_actuales: number;
  total_ingresos: number;
  total_salidas: number;
  umbral: number;
  nivel: NivelAlertaStock;
}

export interface LowStockAlertsResponse {
  umbral: number;
  total_alertas: number;
  alertas: LowStockAlert[];
}
export interface RecordMovementInput {
  variante_id: string;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  motivo: string;
  usuario_id: string | null;
}

export interface MovementFilters {
  limit?: number;
  offset?: number;
  tipo_movimiento?: TipoMovimiento;
  variante_id?: string;
}

interface MovementTotalRow {
  tipo_movimiento: TipoMovimiento;
  total: string | number;
}

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

const OUTBOUND_TYPES: ReadonlySet<TipoMovimiento> = new Set([
  TipoMovimiento.VENTA,
  TipoMovimiento.EXTRACCION_MANUAL,
]);

@Injectable()
export class StockService implements OnModuleInit {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) { }

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION fn_prevent_stock_movement_mutation()
        RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'Operación prohibida: stock_movements es un libro mayor inmutable (append-only).';
        END;
        $$ LANGUAGE plpgsql
      `);
      await this.dataSource.query(
        'DROP TRIGGER IF EXISTS trg_prevent_stock_movement_mutation ON stock_movements',
      );
      await this.dataSource.query(`
        CREATE TRIGGER trg_prevent_stock_movement_mutation
        BEFORE UPDATE OR DELETE ON stock_movements
        FOR EACH ROW EXECUTE FUNCTION fn_prevent_stock_movement_mutation()
      `);
    } catch (error) {
      this.logger.warn(
        `No se pudo aplicar el trigger de inmutabilidad de stock_movements: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  async recordMovement(input: RecordMovementInput): Promise<StockMovement> {
    if (!Number.isInteger(input.cantidad) || input.cantidad <= 0) {
      throw new BadRequestException(
        'La cantidad del movimiento debe ser un número entero mayor a cero.',
      );
    }

    const motivo = input.motivo?.trim() ?? '';
    if (motivo.length === 0) {
      throw new BadRequestException(
        'El motivo del movimiento es obligatorio y no puede estar vacío.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (OUTBOUND_TYPES.has(input.tipo_movimiento)) {
        await this.assertSufficientStock(
          queryRunner,
          input.variante_id,
          input.cantidad,
        );
      }

      const movement = this.stockMovementRepository.create({
        variante_id: input.variante_id,
        tipo_movimiento: input.tipo_movimiento,
        cantidad: input.cantidad,
        motivo,
        usuario_id: input.usuario_id,
      });

      const saved = await queryRunner.manager.save(movement);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async recordManualExtraction(
    dto: ManualExtractionDto,
    usuarioId: string,
  ): Promise<StockMovement> {
    const responsable = usuarioId?.trim() ?? '';
    if (responsable.length === 0) {
      throw new BadRequestException(
        'Se requiere un usuario administrador autenticado para registrar extracciones manuales.',
      );
    }

    return this.recordMovement({
      variante_id: dto.variante_id,
      tipo_movimiento: TipoMovimiento.EXTRACCION_MANUAL,
      cantidad: dto.cantidad,
      motivo: dto.motivo,
      usuario_id: responsable,
    });
  }

  async getStockSummary(varianteId: string): Promise<StockSummary> {
    return this.aggregateSummary(
      () => this.stockMovementRepository.createQueryBuilder('m'),
      varianteId,
    );
  }

  async getLowStockAlerts(umbral = 5): Promise<LowStockAlertsResponse> {
    const rawThreshold =
      typeof umbral === 'number' && Number.isFinite(umbral) ? umbral : 5;
    const safeThreshold = Math.max(0, Math.min(Math.floor(rawThreshold), 1000));

    const rawRows = await this.stockMovementRepository
      .createQueryBuilder('m')
      .select('m.variante_id', 'variante_id')
      .addSelect(
        `COALESCE(SUM(CASE WHEN m.tipo_movimiento = '${TipoMovimiento.INGRESO_PROVEEDOR}' THEN m.cantidad ELSE 0 END), 0)`,
        'total_ingresos',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN m.tipo_movimiento != '${TipoMovimiento.INGRESO_PROVEEDOR}' THEN m.cantidad ELSE 0 END), 0)`,
        'total_salidas',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN m.tipo_movimiento = '${TipoMovimiento.INGRESO_PROVEEDOR}' THEN m.cantidad ELSE -m.cantidad END), 0)`,
        'existencias_actuales',
      )
      .groupBy('m.variante_id')
      .having(
        `COALESCE(SUM(CASE WHEN m.tipo_movimiento = '${TipoMovimiento.INGRESO_PROVEEDOR}' THEN m.cantidad ELSE -m.cantidad END), 0) <= :umbral`,
        { umbral: safeThreshold },
      )
      .orderBy('existencias_actuales', 'ASC')
      .getRawMany<{
        variante_id: string;
        total_ingresos: string | number;
        total_salidas: string | number;
        existencias_actuales: string | number;
      }>();

    const criticalCutoff = Math.max(1, Math.floor(safeThreshold / 2));

    const alertas: LowStockAlert[] = rawRows.map((row) => {
      const stock = Number(row.existencias_actuales);
      let nivel: NivelAlertaStock = 'bajo';
      if (stock <= 0) {
        nivel = 'agotado';
      } else if (stock <= criticalCutoff) {
        nivel = 'critico';
      }
      return {
        variante_id: row.variante_id,
        existencias_actuales: stock,
        total_ingresos: Number(row.total_ingresos),
        total_salidas: Number(row.total_salidas),
        umbral: safeThreshold,
        nivel,
      };
    });

    return {
      umbral: safeThreshold,
      total_alertas: alertas.length,
      alertas,
    };
  }

  async findAllMovements(
    filters: MovementFilters = {},
  ): Promise<StockMovement[]> {
    const {
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
      tipo_movimiento,
      variante_id,
    } = filters;

    const where: FindOptionsWhere<StockMovement> = {};
    if (tipo_movimiento) {
      where.tipo_movimiento = tipo_movimiento;
    }
    if (variante_id) {
      where.variante_id = variante_id;
    }

    return this.stockMovementRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: Math.min(Math.max(limit, 1), MAX_PAGE_SIZE),
      skip: Math.max(offset, 0),
    });
  }
  private async assertSufficientStock(
    queryRunner: QueryRunner,
    varianteId: string,
    cantidad: number,
  ): Promise<void> {
    await queryRunner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      varianteId,
    ]);

    const { existencias_actuales } = await this.aggregateSummary(
      () => queryRunner.manager.createQueryBuilder(StockMovement, 'm'),
      varianteId,
    );

    if (existencias_actuales < cantidad) {
      throw new BadRequestException(
        `Existencias insuficientes para la variante ${varianteId}. Stock disponible: ${existencias_actuales}, solicitado: ${cantidad}.`,
      );
    }
  }
  private async aggregateSummary(
    createQueryBuilder: () => SelectQueryBuilder<StockMovement>,
    varianteId: string,
  ): Promise<StockSummary> {
    const rows = await createQueryBuilder()
      .select('m.tipo_movimiento', 'tipo_movimiento')
      .addSelect('COALESCE(SUM(m.cantidad), 0)', 'total')
      .where('m.variante_id = :varianteId', { varianteId })
      .groupBy('m.tipo_movimiento')
      .getRawMany<MovementTotalRow>();

    const totalOf = (tipo: TipoMovimiento): number =>
      rows
        .filter((row) => row.tipo_movimiento === tipo)
        .reduce((acc, row) => acc + Number(row.total), 0);

    const ingresos = totalOf(TipoMovimiento.INGRESO_PROVEEDOR);
    const ventas = totalOf(TipoMovimiento.VENTA);
    const extracciones = totalOf(TipoMovimiento.EXTRACCION_MANUAL);

    return {
      variante_id: varianteId,
      existencias_actuales: ingresos - (ventas + extracciones),
      total_ingresos: ingresos,
      total_ventas: ventas,
      total_extracciones_manuales: extracciones,
    };
  }
}
