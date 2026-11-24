import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProveedoreDto } from './dto/create-proveedore.dto';
import { UpdateProveedoreDto } from './dto/update-proveedore.dto';
import { Proveedor } from './entities/proveedore.entity';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async create(createProveedoreDto: CreateProveedoreDto): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create(createProveedoreDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async findAll(): Promise<Proveedor[]> {
    return await this.proveedorRepository.find();
  }

  async findOne(id: number): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOneBy({ id });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    return proveedor;
  }

  async update(
    id: number,
    updateProveedoreDto: UpdateProveedoreDto,
  ): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    this.proveedorRepository.merge(proveedor, updateProveedoreDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async remove(id: number): Promise<void> {
    const proveedor = await this.findOne(id);
    await this.proveedorRepository.remove(proveedor);
  }
}
