import { Injectable } from '@nestjs/common';
import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';

@Injectable()
export class VariantesService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createVarianteDto: CreateVarianteDto) {
    return 'This action adds a new variante';
  }

  findAll() {
    return `This action returns all variantes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} variante`;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateVarianteDto: UpdateVarianteDto) {
    return `This action updates a #${id} variante`;
  }

  remove(id: number) {
    return `This action removes a #${id} variante`;
  }
}
