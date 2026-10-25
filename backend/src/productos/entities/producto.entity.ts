import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Variante } from '../../variantes/entities/variante.entity';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @Column({ type: 'varchar', length: 100 })
  marca!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costo!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  garantia!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  // Relaciones
  @ManyToOne(() => Categoria, (categoria) => categoria.productos)
  categoria!: Categoria;

  @OneToMany(() => Variante, (variante) => variante.producto)
  variantes!: Variante[];
}