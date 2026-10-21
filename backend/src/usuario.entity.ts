import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Definimos los roles permitidos según la planificación
export enum RolUsuario {
  ADMIN_VENTAS = 'admin_ventas',
  CLIENTE = 'cliente',
  SOPORTE = 'soporte',
}

@Entity('usuarios') // Esto le dice a TypeORM que cree una tabla llamada "usuarios"
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  // unique: true evita duplicados, update: false lo hace inmodificable
  @Column({ type: 'varchar', length: 150, unique: true, update: false })
  correo_electronico!: string;

  @Column({ type: 'varchar' })
  contrasena_hash!: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.CLIENTE,
  })
  rol!: RolUsuario;

  // Siempre es buena práctica guardar cuándo se creó y actualizó el registro
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion!: Date;
}