import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  BeforeUpdate,
  BeforeRemove,
} from 'typeorm';
import { TipoMovimiento } from '../enums/tipo-movimiento.enum';

@Entity('stock_movements')
@Index(['variante_id', 'created_at'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  variante_id: string;

  @Column({
    type: 'enum',
    enum: TipoMovimiento,
  })
  tipo_movimiento: TipoMovimiento;

  /**
   * Cantidad de unidades involucradas en el movimiento.
   * Siempre se registra como un entero positivo (> 0).
   * El impacto (adición o sustracción) se determina estrictamente por el `tipo_movimiento`.
   */
  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // =========================================================================
  // Reglas de Inmutabilidad (Append-Only Ledger)
  // =========================================================================

  @BeforeUpdate()
  preventUpdate(): void {
    throw new Error(
      'Operación no permitida: Los registros de StockMovement son inmutables (append-only) y no admiten actualizaciones.',
    );
  }

  @BeforeRemove()
  preventRemove(): void {
    throw new Error(
      'Operación no permitida: Los registros de StockMovement son inmutables y no pueden ser eliminados de la base de datos.',
    );
  }
}
