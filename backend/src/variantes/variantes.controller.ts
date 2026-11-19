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
import { VariantesService } from './variantes.service';
import { VarianteConStock, VariantePublica } from '../productos/catalog.types';
import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

@Controller('variantes')
export class VariantesController {
  constructor(private readonly variantesService: VariantesService) {}

  @Get('admin')
  @Roles(RolUsuario.ADMINISTRADOR)
  async findAllAdmin(
    @Query('producto_id', new ParseUUIDPipe({ version: '4', optional: true }))
    productoId?: string,
  ): Promise<VarianteConStock[]> {
    return this.variantesService.findAllAdmin(productoId);
  }

  @Public()
  @Get()
  async findAllPublic(
    @Query('producto_id', new ParseUUIDPipe({ version: '4', optional: true }))
    productoId?: string,
  ): Promise<VariantePublica[]> {
    return this.variantesService.findAllPublic(productoId);
  }

  @Public()
  @Get(':id')
  async findOnePublic(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<VariantePublica> {
    return this.variantesService.findOnePublic(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolUsuario.ADMINISTRADOR)
  async create(@Body() dto: CreateVarianteDto): Promise<VarianteConStock> {
    return this.variantesService.create(dto);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateVarianteDto,
  ): Promise<VarianteConStock> {
    return this.variantesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RolUsuario.ADMINISTRADOR)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.variantesService.remove(id);
  }
}
