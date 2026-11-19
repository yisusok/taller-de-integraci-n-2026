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
  Query,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import {
  PaginatedResult,
  ProductoAdmin,
  ProductoPublico,
} from './catalog.types';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import {
  QueryAdminProductosDto,
  QueryPublicProductosDto,
} from './dto/query-productos.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get('admin')
  @Roles(RolUsuario.ADMINISTRADOR)
  async findAllAdmin(
    @Query() query: QueryAdminProductosDto,
  ): Promise<PaginatedResult<ProductoAdmin>> {
    return this.productosService.findAllAdmin(query);
  }

  @Get('admin/:id')
  @Roles(RolUsuario.ADMINISTRADOR)
  async findOneAdmin(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ProductoAdmin> {
    return this.productosService.findOneAdmin(id);
  }

  @Public()
  @Get()
  async findAllPublic(
    @Query() query: QueryPublicProductosDto,
  ): Promise<PaginatedResult<ProductoPublico>> {
    return this.productosService.findAllPublic(query);
  }

  @Public()
  @Get(':id')
  async findOnePublic(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ProductoPublico> {
    return this.productosService.findOnePublic(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolUsuario.ADMINISTRADOR)
  async create(@Body() dto: CreateProductoDto): Promise<ProductoAdmin> {
    return this.productosService.create(dto);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductoDto,
  ): Promise<ProductoAdmin> {
    return this.productosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RolUsuario.ADMINISTRADOR)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.productosService.remove(id);
  }
}
