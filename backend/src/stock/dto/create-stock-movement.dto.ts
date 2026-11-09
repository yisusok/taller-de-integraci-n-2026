import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { TipoMovimiento } from '../enums/tipo-movimiento.enum';

export class CreateStockMovementDto {
  @IsUUID('4', { message: 'variante_id debe ser un UUID válido versión 4' })
  @IsNotEmpty({ message: 'variante_id es obligatorio' })
  variante_id: string;

  @IsEnum(TipoMovimiento, {
    message: `tipo_movimiento debe ser uno de: ${Object.values(TipoMovimiento).join(', ')}`,
  })
  @IsNotEmpty({ message: 'tipo_movimiento es obligatorio' })
  tipo_movimiento: TipoMovimiento;

  @IsInt({ message: 'cantidad debe ser un número entero' })
  @IsPositive({ message: 'cantidad debe ser mayor a cero' })
  cantidad: number;

  @IsString({ message: 'motivo debe ser un texto' })
  @IsNotEmpty({ message: 'motivo no puede estar vacío' })
  motivo: string;

  @IsUUID('4', { message: 'usuario_id debe ser un UUID válido' })
  @IsOptional()
  usuario_id?: string;
}
