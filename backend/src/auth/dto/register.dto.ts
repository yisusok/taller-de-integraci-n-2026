import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RolUsuario } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : '',
  )
  nombre!: string;

  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @MaxLength(150, {
    message: 'El correo electrónico no puede exceder 150 caracteres',
  })
  @Transform(
    ({ value, obj }: { value: unknown; obj?: Record<string, unknown> }) => {
      const raw =
        typeof value === 'string'
          ? value
          : typeof obj?.correo_electronico === 'string'
            ? obj.correo_electronico
            : typeof obj?.email === 'string'
              ? obj.email
              : '';
      return raw.trim().toLowerCase();
    },
  )
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede exceder 72 caracteres' })
  @Transform(
    ({ value, obj }: { value: unknown; obj?: Record<string, unknown> }) => {
      if (typeof value === 'string') {
        return value;
      }
      if (typeof obj?.contrasena === 'string') {
        return obj.contrasena;
      }
      if (typeof obj?.password === 'string') {
        return obj.password;
      }
      return '';
    },
  )
  password!: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol proporcionado no es válido' })
  rol?: RolUsuario;

  get correo_electronico(): string {
    return this.email;
  }

  get contrasena(): string {
    return this.password;
  }
}
