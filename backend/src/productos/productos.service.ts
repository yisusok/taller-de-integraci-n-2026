import { Injectable } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createProductoDto: CreateProductoDto) {
    return 'This action adds a new producto';
  }

  findAll() {
    return `This action returns all productos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} producto`;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateProductoDto: UpdateProductoDto) {
    return `This action updates a #${id} producto`;
  }

  remove(id: number) {
    return `This action removes a #${id} producto`;
  }
}
