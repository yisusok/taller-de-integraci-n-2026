import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';

@Entity('variantes')
@Index('uq_variantes_producto_talle_color_lower', { synchronize: false })
@Index('idx_variantes_producto_activa', ['producto_id', 'activa'])
export class Variante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  producto_id: string;

  @Column({ type: 'varchar', length: 20 })
  talle: string;

  @Column({ type: 'varchar', length: 50 })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  material: string | null;

  @Column({ type: 'varchar', length: 80, unique: true })
  sku_variante: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @ManyToOne(() => Producto, (producto) => producto.variantes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
