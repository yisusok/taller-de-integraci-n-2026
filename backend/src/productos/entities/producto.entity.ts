import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Variante } from '../../variantes/entities/variante.entity';

const numericTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | number | null) =>
    value === null || value === undefined ? 0 : Number(value),
};

@Entity('productos')
@Index('idx_productos_categoria_id', ['categoria_id'])
@Index('idx_productos_activo_created_at', ['activo', 'created_at'])
@Index('idx_productos_marca', ['marca'])
@Index('idx_productos_etiquetas_gin', ['etiquetas'], { type: 'gin' })
@Check('chk_productos_costo_non_negative', '"costo" >= 0')
@Check('chk_productos_precio_non_negative', '"precio" >= 0')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 100 })
  marca: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  costo: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  precio: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  garantia: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  uso_recomendado: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  etiquetas: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen_url: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'uuid' })
  categoria_id: string;

  @ManyToOne(() => Categoria, (categoria) => categoria.productos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @OneToMany(() => Variante, (variante) => variante.producto, { cascade: true })
  variantes: Variante[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
