import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { trimString, trimToUpper } from '../../common/utils/validation.util';

export class UpdateVarianteDto {
  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El talle debe ser texto' })
  @IsNotEmpty({ message: 'El talle no puede estar vacío' })
  @MaxLength(20, { message: 'El talle no puede superar los 20 caracteres' })
  talle?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El color debe ser texto' })
  @IsNotEmpty({ message: 'El color no puede estar vacío' })
  @MaxLength(50, { message: 'El color no puede superar los 50 caracteres' })
  color?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El material debe ser texto' })
  @MaxLength(50, { message: 'El material no puede superar los 50 caracteres' })
  material?: string;

  @IsOptional()
  @Transform(trimToUpper)
  @IsString({ message: 'sku_variante debe ser texto' })
  @IsNotEmpty({ message: 'sku_variante no puede estar vacío' })
  @MaxLength(80, {
    message: 'sku_variante no puede superar los 80 caracteres',
  })
  sku_variante?: string;

  @IsOptional()
  @IsBoolean({ message: 'activa debe ser un booleano' })
  activa?: boolean;
}
