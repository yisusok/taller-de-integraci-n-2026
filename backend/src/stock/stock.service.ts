import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
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
import { Variante } from '../variantes/entities/variante.entity';
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
  producto_id: string;
  producto_nombre: string;
  producto_sku: string;
  talle: string;
  color: string;
  sku_variante: string;
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

const NET_STOCK_SQL =
  'COALESCE(SUM(CASE WHEN m.tipo_movimiento = :ingreso THEN m.cantidad ELSE -m.cantidad END), 0)';

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
    @InjectRepository(Variante)
    private readonly varianteRepository: Repository<Variante>,
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
      await this.dataSource.query(`
        CREATE OR REPLACE TRIGGER trg_prevent_stock_movement_mutation
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
      const variante = await queryRunner.manager.findOne(Variante, {
        where: { id: input.variante_id },
      });
      if (!variante) {
        throw new NotFoundException(
          `Variante con ID ${input.variante_id} no encontrada.`,
        );
      }

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

  async getStockByVariants(
    varianteIds: string[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (varianteIds.length === 0) {
      return result;
    }

    const ids = Array.from(new Set(varianteIds));
    const rows = await this.stockMovementRepository
      .createQueryBuilder('m')
      .select('m.variante_id', 'variante_id')
      .addSelect(NET_STOCK_SQL, 'existencias_actuales')
      .where('m.variante_id IN (:...ids)', { ids })
      .setParameter('ingreso', TipoMovimiento.INGRESO_PROVEEDOR)
      .groupBy('m.variante_id')
      .getRawMany<{
        variante_id: string;
        existencias_actuales: string | number;
      }>();

    for (const row of rows) {
      result.set(row.variante_id, Number(row.existencias_actuales));
    }

    return result;
  }

  async hasMovements(varianteIds: string[]): Promise<boolean> {
    if (varianteIds.length === 0) {
      return false;
    }

    const ids = Array.from(new Set(varianteIds));
    const count = await this.stockMovementRepository
      .createQueryBuilder('m')
      .where('m.variante_id IN (:...ids)', { ids })
      .getCount();

    return count > 0;
  }

  async getLowStockAlerts(umbral = 5): Promise<LowStockAlertsResponse> {
    const rawThreshold =
      typeof umbral === 'number' && Number.isFinite(umbral) ? umbral : 5;
    const safeThreshold = Math.max(0, Math.min(Math.floor(rawThreshold), 1000));

    const rawRows = await this.varianteRepository
      .createQueryBuilder('v')
      .innerJoin('v.producto', 'p')
      .leftJoin(StockMovement, 'm', 'm.variante_id = v.id')
      .where('v.activa = :varActiva AND p.activo = :prodActivo', {
        varActiva: true,
        prodActivo: true,
      })
      .select('v.id', 'variante_id')
      .addSelect('p.id', 'producto_id')
      .addSelect('p.nombre', 'producto_nombre')
      .addSelect('p.sku', 'producto_sku')
      .addSelect('v.talle', 'talle')
      .addSelect('v.color', 'color')
      .addSelect('v.sku_variante', 'sku_variante')
      .addSelect(
        'COALESCE(SUM(CASE WHEN m.tipo_movimiento = :ingreso THEN m.cantidad ELSE 0 END), 0)',
        'total_ingresos',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN m.tipo_movimiento IS NOT NULL AND m.tipo_movimiento != :ingreso THEN m.cantidad ELSE 0 END), 0)',
        'total_salidas',
      )
      .addSelect(NET_STOCK_SQL, 'existencias_actuales')
      .setParameter('ingreso', TipoMovimiento.INGRESO_PROVEEDOR)
      .groupBy('v.id')
      .addGroupBy('p.id')
      .having(`${NET_STOCK_SQL} <= :umbral`, { umbral: safeThreshold })
      .orderBy('existencias_actuales', 'ASC')
      .addOrderBy('p.nombre', 'ASC')
      .getRawMany<{
        variante_id: string;
        producto_id: string;
        producto_nombre: string;
        producto_sku: string;
        talle: string;
        color: string;
        sku_variante: string;
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
        producto_id: row.producto_id,
        producto_nombre: row.producto_nombre,
        producto_sku: row.producto_sku,
        talle: row.talle,
        color: row.color,
        sku_variante: row.sku_variante,
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
    await queryRunner.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [varianteId],
    );

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
