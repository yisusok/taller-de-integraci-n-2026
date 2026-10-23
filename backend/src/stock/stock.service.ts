import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { TipoMovimiento } from './enums/tipo-movimiento.enum';

export interface StockSummary {
  variante_id: string;
  existencias_actuales: number;
  total_ingresos: number;
  total_ventas: number;
  total_extracciones_manuales: number;
}

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registra un nuevo movimiento de stock de forma atómica e inmutable.
   * Prohíbe mutaciones directas sobre existencias: la única forma de cambiar el stock
   * es agregando un registro a este libro mayor (append-only ledger).
   */
  async recordMovement(dto: CreateStockMovementDto): Promise<StockMovement> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Si el movimiento es de salida (VENTA o EXTRACCION_MANUAL), verificamos stock suficiente
      if (
        dto.tipo_movimiento === TipoMovimiento.VENTA ||
        dto.tipo_movimiento === TipoMovimiento.EXTRACCION_MANUAL
      ) {
        const currentStock = await this.calculateCurrentStockInTransaction(
          queryRunner,
          dto.variante_id,
        );

        if (currentStock < dto.cantidad) {
          throw new BadRequestException(
            `Existencias insuficientes para la variante ${dto.variante_id}. Stock disponible: ${currentStock}, solicitado: ${dto.cantidad}.`,
          );
        }
      }

      const movement = this.stockMovementRepository.create({
        variante_id: dto.variante_id,
        tipo_movimiento: dto.tipo_movimiento,
        cantidad: dto.cantidad,
        motivo: dto.motivo,
        usuario_id: dto.usuario_id ?? null,
      });

      const savedMovement = await queryRunner.manager.save(movement);
      await queryRunner.commitTransaction();

      return savedMovement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene el resumen de existencias actuales calculado a partir del libro mayor de movimientos.
   */
  async getStockSummary(varianteId: string): Promise<StockSummary> {
    const movements = await this.stockMovementRepository.find({
      where: { variante_id: varianteId },
      order: { created_at: 'ASC' },
    });

    if (movements.length === 0) {
      return {
        variante_id: varianteId,
        existencias_actuales: 0,
        total_ingresos: 0,
        total_ventas: 0,
        total_extracciones_manuales: 0,
      };
    }

    let ingresos = 0;
    let ventas = 0;
    let extracciones = 0;

    for (const mov of movements) {
      if (mov.tipo_movimiento === TipoMovimiento.INGRESO_PROVEEDOR) {
        ingresos += mov.cantidad;
      } else if (mov.tipo_movimiento === TipoMovimiento.VENTA) {
        ventas += mov.cantidad;
      } else if (mov.tipo_movimiento === TipoMovimiento.EXTRACCION_MANUAL) {
        extracciones += mov.cantidad;
      }
    }

    return {
      variante_id: varianteId,
      existencias_actuales: ingresos - (ventas + extracciones),
      total_ingresos: ingresos,
      total_ventas: ventas,
      total_extracciones_manuales: extracciones,
    };
  }

  /**
   * Consulta el historial completo de movimientos para auditoría.
   */
  async getMovementsByVariant(varianteId: string): Promise<StockMovement[]> {
    return this.stockMovementRepository.find({
      where: { variante_id: varianteId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Obtiene todos los movimientos recientes del sistema con paginación.
   */
  async findAllMovements(limit = 50, offset = 0): Promise<StockMovement[]> {
    return this.stockMovementRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Cálculo interno de existencias dentro de una transacción activa para prevenir condiciones de carrera.
   */
  private async calculateCurrentStockInTransaction(
    queryRunner: QueryRunner,
    varianteId: string,
  ): Promise<number> {
    const movements: StockMovement[] = await queryRunner.manager.find(
      StockMovement,
      {
        where: { variante_id: varianteId },
      },
    );

    let stock = 0;
    for (const mov of movements) {
      if (mov.tipo_movimiento === TipoMovimiento.INGRESO_PROVEEDOR) {
        stock += mov.cantidad;
      } else {
        stock -= mov.cantidad;
      }
    }
    return stock;
  }
}
