import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { Categoria } from './entities/categoria.entity';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get('admin')
  @Roles(RolUsuario.ADMINISTRADOR)
  async findAllAdmin(): Promise<Categoria[]> {
    return this.categoriasService.findAll(false);
  }

  @Public()
  @Get()
  async findAllPublic(): Promise<Categoria[]> {
    return this.categoriasService.findAll(true);
  }

  @Public()
  @Get(':id')
  async findOnePublic(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Categoria> {
    return this.categoriasService.findOnePublic(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolUsuario.ADMINISTRADOR)
  async create(@Body() dto: CreateCategoriaDto): Promise<Categoria> {
    return this.categoriasService.create(dto);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCategoriaDto,
  ): Promise<Categoria> {
    return this.categoriasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RolUsuario.ADMINISTRADOR)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.categoriasService.remove(id);
  }
}
