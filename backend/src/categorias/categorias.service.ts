import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { Producto } from '../productos/entities/producto.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService implements OnModuleInit {
  private readonly logger = new Logger(CategoriasService.name);

  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS uq_categorias_nombre_lower ON categorias (LOWER(nombre))',
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo crear uq_categorias_nombre_lower: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findAll(soloActivas = false): Promise<Categoria[]> {
    const categorias = await this.categoriaRepository.find({
      where: soloActivas ? { activa: true } : {},
      order: { nombre: 'ASC' },
    });

    if (categorias.length === 0) {
      return [];
    }

    const countQb = this.productoRepository
      .createQueryBuilder('p')
      .select('p.categoria_id', 'categoria_id')
      .addSelect('COUNT(p.id)', 'total')
      .where('p.categoria_id IN (:...ids)', {
        ids: categorias.map((c) => c.id),
      });

    if (soloActivas) {
      countQb.andWhere('p.activo = :prodActivo', { prodActivo: true });
    }

    const counts = await countQb
      .groupBy('p.categoria_id')
      .getRawMany<{ categoria_id: string; total: string | number }>();

    const countMap = new Map(
      counts.map((row) => [row.categoria_id, Number(row.total)]),
    );

    return categorias.map((categoria) => ({
      ...categoria,
      productos_count: countMap.get(categoria.id) ?? 0,
    }));
  }

  async findOne(id: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({ where: { id } });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada.`);
    }
    return categoria;
  }

  async findOnePublic(id: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id, activa: true },
    });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada.`);
    }
    return categoria;
  }

  async create(dto: CreateCategoriaDto): Promise<Categoria> {
    const nombre = dto.nombre?.trim() ?? '';
    if (nombre.length < 2) {
      throw new BadRequestException(
        'El nombre de la categoría es obligatorio y debe tener al menos 2 caracteres.',
      );
    }

    const existing = await this.categoriaRepository
      .createQueryBuilder('c')
      .where('LOWER(c.nombre) = LOWER(:nombre)', { nombre })
      .getOne();

    if (existing) {
      throw new ConflictException(
        `Ya existe una categoría registrada con el nombre "${nombre}".`,
      );
    }

    const categoria = this.categoriaRepository.create({
      nombre,
      descripcion: dto.descripcion?.trim() || null,
      activa: dto.activa ?? true,
    });

    return this.categoriaRepository.save(categoria);
  }

  async update(id: string, dto: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await this.findOne(id);

    if (dto.nombre !== undefined) {
      const nombre = dto.nombre.trim();
      if (nombre.length < 2) {
        throw new BadRequestException(
          'El nombre de la categoría debe tener al menos 2 caracteres.',
        );
      }

      const conflict = await this.categoriaRepository
        .createQueryBuilder('c')
        .where('LOWER(c.nombre) = LOWER(:nombre)', { nombre })
        .andWhere('c.id != :id', { id })
        .getOne();

      if (conflict) {
        throw new ConflictException(
          `Ya existe otra categoría con el nombre "${nombre}".`,
        );
      }
      categoria.nombre = nombre;
    }

    if (dto.descripcion !== undefined) {
      categoria.descripcion = dto.descripcion.trim() || null;
    }

    if (dto.activa !== undefined) {
      categoria.activa = dto.activa;
    }

    return this.categoriaRepository.save(categoria);
  }

  async remove(id: string): Promise<void> {
    const categoria = await this.findOne(id);
    const productCount = await this.productoRepository.count({
      where: { categoria_id: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene productos asociados. Desactivala en su lugar.',
      );
    }

    await this.categoriaRepository.remove(categoria);
  }
}
