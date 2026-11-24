import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class ManualExtractionDto {
  @IsUUID('4', { message: 'variante_id debe ser un UUID válido versión 4' })
  @IsNotEmpty({ message: 'variante_id es obligatorio' })
  variante_id: string;

  @IsInt({ message: 'cantidad debe ser un número entero' })
  @IsPositive({ message: 'cantidad debe ser mayor a cero' })
  cantidad: number;

  @IsString({ message: 'motivo debe ser un texto' })
  @IsNotEmpty({ message: 'motivo no puede estar vacío' })
  @MinLength(5, {
    message: 'motivo debe tener al menos 5 caracteres para auditoría',
  })
  motivo: string;
}
