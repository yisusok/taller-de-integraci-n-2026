import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 50 })
  alias!: string;

  @Column({ type: 'varchar', length: 150 })
  calle!: string;

  @Column({ type: 'varchar', length: 20 })
  numero!: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'piso_depto' })
  pisoDepto?: string | null;

  @Column({ type: 'varchar', length: 100 })
  ciudad!: string;

  @Column({ type: 'varchar', length: 100 })
  provincia!: string;

  @Column({ type: 'varchar', length: 20, name: 'codigo_postal' })
  codigoPostal!: string;

  @Column({ type: 'boolean', default: false, name: 'es_predeterminada' })
  esPredeterminada!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
