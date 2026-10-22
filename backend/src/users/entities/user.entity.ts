import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RolUsuario {
  ADMIN_VENTAS = 'admin_ventas',
  CLIENTE = 'cliente',
  SOPORTE = 'soporte',
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

  @Column({
    type: 'varchar',
    length: 50,
    default: 'local',
    name: 'auth_provider',
  })
  authProvider!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'provider_id',
  })
  providerId?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  get correo_electronico(): string {
    return this.email;
  }
  set correo_electronico(val: string) {
    this.email = val;
  }

  get contrasena_hash(): string | null {
    return this.password_hash;
  }
  set contrasena_hash(val: string | null) {
    this.password_hash = val;
  }
}

export { User as Usuario };
