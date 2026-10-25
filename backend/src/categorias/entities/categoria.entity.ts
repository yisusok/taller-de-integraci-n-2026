import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Producto } from '../../productos/entities/producto.entity';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos!: Producto[];
}