import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateProveedoreDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  marcas?: string[];
}
