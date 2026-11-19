import { Transform, Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';
import { trimString, trimToUpper } from '../../common/utils/validation.util';

export class InitialVarianteDto {
  @Transform(trimString)
  @IsString({ message: 'El talle debe ser texto' })
  @IsNotEmpty({ message: 'El talle es obligatorio' })
  @MaxLength(20, { message: 'El talle no puede superar los 20 caracteres' })
  talle: string;

  @Transform(trimString)
  @IsString({ message: 'El color debe ser texto' })
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @MaxLength(50, { message: 'El color no puede superar los 50 caracteres' })
  color: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El material debe ser texto' })
  @MaxLength(50, { message: 'El material no puede superar los 50 caracteres' })
  material?: string;

  @IsOptional()
  @Transform(trimToUpper)
  @IsString({ message: 'sku_variante debe ser texto' })
  @MaxLength(80, {
    message: 'sku_variante no puede superar los 80 caracteres',
  })
  sku_variante?: string;
}

export class CreateProductoDto {
  @Transform(trimToUpper)
  @IsString({ message: 'El SKU debe ser texto' })
  @IsNotEmpty({ message: 'El SKU base es obligatorio' })
  @MaxLength(50, { message: 'El SKU base no puede superar los 50 caracteres' })
  sku: string;

  @Transform(trimString)
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MinLength(2, {
    message: 'El nombre del producto debe tener al menos 2 caracteres',
  })
  @MaxLength(150, {
    message: 'El nombre del producto no puede superar los 150 caracteres',
  })
  nombre: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(2000, {
    message: 'La descripción no puede superar los 2000 caracteres',
  })
  descripcion?: string;

  @Transform(trimString)
  @IsString({ message: 'La marca debe ser texto' })
  @IsNotEmpty({ message: 'La marca es obligatoria' })
  @MaxLength(100, { message: 'La marca no puede superar los 100 caracteres' })
  marca: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El costo debe ser un número con hasta 2 decimales' },
  )
  @Min(0, { message: 'El costo no puede ser negativo' })
  @Max(99999999.99, { message: 'El costo supera el máximo permitido' })
  costo: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de venta debe ser un número con hasta 2 decimales' },
  )
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  @Max(99999999.99, {
    message: 'El precio de venta supera el máximo permitido',
  })
  precio: number;

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

  @IsUUID('4', { message: 'categoria_id debe ser un UUID versión 4 válido' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoria_id: string;

  @IsOptional()
  @IsArray({ message: 'variantes debe ser un arreglo' })
  @ArrayMaxSize(50, {
    message: 'No podés crear más de 50 variantes iniciales de una vez',
  })
  @ValidateNested({ each: true })
  @Type(() => InitialVarianteDto)
  variantes?: InitialVarianteDto[];
}
