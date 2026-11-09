import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';

@Entity('variantes')
export class Variante {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  talle!: string;

  @Column({ type: 'varchar', length: 50 })
  color!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  material!: string;

  @ManyToOne(() => Producto, (producto) => producto.variantes)
  producto!: Producto;
}
