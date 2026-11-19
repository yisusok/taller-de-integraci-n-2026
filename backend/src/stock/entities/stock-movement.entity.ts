import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Check,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
  BeforeRemove,
} from 'typeorm';
import { TipoMovimiento } from '../enums/tipo-movimiento.enum';
import { Variante } from '../../variantes/entities/variante.entity';
import { User } from '../../users/entities/user.entity';

@Entity('stock_movements')
@Index(['variante_id', 'created_at'])
@Index('idx_stock_movements_usuario', ['usuario_id'])
@Check('chk_stock_movements_cantidad_positive', '"cantidad" > 0')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  variante_id: string;

  @ManyToOne(() => Variante, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variante_id' })
  variante?: Variante;

  @Column({
    type: 'enum',
    enum: TipoMovimiento,
  })
  tipo_movimiento: TipoMovimiento;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

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
