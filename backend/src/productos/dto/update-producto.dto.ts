import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString, trimToUpper } from '../../common/utils/validation.util';

export class UpdateProductoDto {
  @IsOptional()
  @Transform(trimToUpper)
  @IsString({ message: 'El SKU debe ser texto' })
  @IsNotEmpty({ message: 'El SKU no puede estar vacío' })
  @MaxLength(50, { message: 'El SKU base no puede superar los 50 caracteres' })
  sku?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, {
    message: 'El nombre del producto debe tener al menos 2 caracteres',
  })
  @MaxLength(150, {
    message: 'El nombre del producto no puede superar los 150 caracteres',
  })
  nombre?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(2000, {
    message: 'La descripción no puede superar los 2000 caracteres',
  })
  descripcion?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'La marca debe ser texto' })
  @IsNotEmpty({ message: 'La marca no puede estar vacía' })
  @MaxLength(100, { message: 'La marca no puede superar los 100 caracteres' })
  marca?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El costo debe ser un número con hasta 2 decimales' },
  )
  @Min(0, { message: 'El costo no puede ser negativo' })
  @Max(99999999.99, { message: 'El costo supera el máximo permitido' })
  costo?: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de venta debe ser un número con hasta 2 decimales' },
  )
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  @Max(99999999.99, {
    message: 'El precio de venta supera el máximo permitido',
  })
  precio?: number;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'La garantía debe ser texto' })
  @MaxLength(100, {
    message: 'La garantía no puede superar los 100 caracteres',
  })
  garantia?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El uso recomendado debe ser texto' })
  @MaxLength(120, {
    message: 'El uso recomendado no puede superar los 120 caracteres',
  })
  uso_recomendado?: string;

  @IsOptional()
  @IsArray({ message: 'Las etiquetas deben ser una lista de textos' })
  @ArrayMaxSize(20, { message: 'No podés asignar más de 20 etiquetas' })
  @IsString({ each: true, message: 'Cada etiqueta debe ser texto' })
  @MaxLength(40, {
    each: true,
    message: 'Cada etiqueta no puede superar los 40 caracteres',
  })
  etiquetas?: string[];

  @IsOptional()
  @Transform(trimString)
  @ValidateIf(
    (o: { imagen_url?: unknown }) =>
      o.imagen_url !== '' &&
      o.imagen_url !== null &&
      o.imagen_url !== undefined,
  )
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'imagen_url debe ser una URL http/https válida' },
  )
  @MaxLength(500, {
    message: 'imagen_url no puede superar los 500 caracteres',
  })
  imagen_url?: string;

  @IsOptional()
  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo?: boolean;

  @IsOptional()
  @IsUUID('4', { message: 'categoria_id debe ser un UUID versión 4 válido' })
  categoria_id?: string;
}
