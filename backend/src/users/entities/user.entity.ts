import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RolUsuario {
  ADMINISTRADOR = 'administrador',
  CLIENTE = 'cliente',
  VISITANTE = 'visitante',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 150, unique: true, update: false })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash!: string | null;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.CLIENTE,
  })
  rol!: RolUsuario;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar?: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'local',
    name: 'auth_provider',
  })
  authProvider!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'provider_id' })
  providerId?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'reset_password_token',
  })
  resetPasswordToken?: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'reset_password_expires' })
  resetPasswordExpires?: Date | null;
}
