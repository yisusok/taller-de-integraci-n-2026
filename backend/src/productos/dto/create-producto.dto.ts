import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  marca!: string;

  @IsNotEmpty()
  costo!: string;

  @IsNotEmpty()
  precio!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  garantia?: string;

  @IsString()
  @IsOptional()
  etiquetas?: string;

  @IsString()
  @IsOptional()
  estado?: string;
}
