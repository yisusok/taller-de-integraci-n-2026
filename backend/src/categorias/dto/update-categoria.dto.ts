import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimString } from '../../common/utils/validation.util';

export class UpdateCategoriaDto {
  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, {
    message: 'El nombre de la categoría debe tener al menos 2 caracteres',
  })
  @MaxLength(50, {
    message: 'El nombre de la categoría no puede superar los 50 caracteres',
  })
  nombre?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  descripcion?: string;

  @IsOptional()
  @IsBoolean({ message: 'activa debe ser un booleano' })
  activa?: boolean;
}
