import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'El alias es obligatorio (ej. Casa, Trabajo)' })
  @MaxLength(50, { message: 'El alias no puede superar los 50 caracteres' })
  alias!: string;

  @IsString()
  @IsNotEmpty({ message: 'La calle es obligatoria' })
  @MaxLength(150, { message: 'La calle no puede superar los 150 caracteres' })
  calle!: string;

  @IsString()
  @IsNotEmpty({ message: 'El número o altura es obligatorio' })
  @MaxLength(20, { message: 'El número no puede superar los 20 caracteres' })
  numero!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'El piso o departamento no puede superar los 50 caracteres',
  })
  pisoDepto?: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @MaxLength(100, { message: 'La ciudad no puede superar los 100 caracteres' })
  ciudad!: string;

  @IsString()
  @IsNotEmpty({ message: 'La provincia es obligatoria' })
  @MaxLength(100, {
    message: 'La provincia no puede superar los 100 caracteres',
  })
  provincia!: string;

  @IsString()
  @IsNotEmpty({ message: 'El código postal es obligatorio' })
  @MaxLength(20, {
    message: 'El código postal no puede superar los 20 caracteres',
  })
  codigoPostal!: string;

  @IsOptional()
  @IsBoolean({ message: 'El indicador de predeterminada debe ser booleano' })
  esPredeterminada?: boolean;
}
