import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../common/utils/validation.util';

export class QueryPublicProductosDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID('4', { message: 'categoria_id debe ser un UUID versión 4 válido' })
  categoria_id?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  marca?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(60)
  etiqueta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit mínimo es 1' })
  @Max(100, { message: 'limit máximo es 100' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset debe ser un entero' })
  @Min(0, { message: 'offset no puede ser negativo' })
  offset?: number;
}

export class QueryAdminProductosDto extends QueryPublicProductosDto {
  @IsOptional()
  @IsIn(['true', 'false'], {
    message: 'activo debe ser "true" o "false"',
  })
  activo?: 'true' | 'false';
}
