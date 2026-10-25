import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VariantesService } from './variantes.service';
import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';

@Controller('variantes')
export class VariantesController {
  constructor(private readonly variantesService: VariantesService) {}

  @Post()
  create(@Body() createVarianteDto: CreateVarianteDto) {
    return this.variantesService.create(createVarianteDto);
  }

  @Get()
  findAll() {
    return this.variantesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variantesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVarianteDto: UpdateVarianteDto) {
    return this.variantesService.update(+id, updateVarianteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.variantesService.remove(+id);
  }
}
