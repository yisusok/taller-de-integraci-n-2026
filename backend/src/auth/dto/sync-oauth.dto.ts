import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SyncOauthDto {
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El formato de correo no es válido' })
  email!: string;

  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}
