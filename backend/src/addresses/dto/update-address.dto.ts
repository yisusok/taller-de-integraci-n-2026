import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'El alias no puede superar los 50 caracteres' })
  alias?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'La calle no puede superar los 150 caracteres' })
  calle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El número no puede superar los 20 caracteres' })
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'El piso o departamento no puede superar los 50 caracteres',
  })
  pisoDepto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La ciudad no puede superar los 100 caracteres' })
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'La provincia no puede superar los 100 caracteres',
  })
  provincia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, {
    message: 'El código postal no puede superar los 20 caracteres',
  })
  codigoPostal?: string;

  @IsOptional()
  @IsBoolean({ message: 'El indicador de predeterminada debe ser booleano' })
  esPredeterminada?: boolean;
}
