import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  async create(createProductoDto: CreateProductoDto, imagenes: string[] = []) {
    const nuevoProducto = this.productoRepository.create({
      sku: createProductoDto.sku,
      nombre: createProductoDto.nombre,
      marca: createProductoDto.marca,
      costo: Number(createProductoDto.costo),
      precio: Number(createProductoDto.precio),
      descripcion: createProductoDto.descripcion,
      garantia: createProductoDto.garantia,
      etiquetas: createProductoDto.etiquetas,
      activo: createProductoDto.estado !== 'pausado',
      imagenes,
    });

    return await this.productoRepository.save(nuevoProducto);
  }

  async findAll() {
    return await this.productoRepository.find();
  }

  async findOne(id: string) {
    const producto = await this.productoRepository.findOne({
      where: { id },
    });
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: string, updateProductoDto: UpdateProductoDto) {
    const producto = await this.findOne(id);
    Object.assign(producto, {
      ...updateProductoDto,
      ...(updateProductoDto.costo !== undefined && {
        costo: Number(updateProductoDto.costo),
      }),
      ...(updateProductoDto.precio !== undefined && {
        precio: Number(updateProductoDto.precio),
      }),
      ...(updateProductoDto.estado !== undefined && {
        activo: updateProductoDto.estado === 'activo',
      }),
    });
    return await this.productoRepository.save(producto);
  }

  async remove(id: string) {
    const producto = await this.findOne(id);
    producto.activo = false; // Baja lógica según RF-02
    return await this.productoRepository.save(producto);
  }
}