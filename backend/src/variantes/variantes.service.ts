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
import { Variante } from './entities/variante.entity';
import { Producto } from '../productos/entities/producto.entity';
import { StockService } from '../stock/stock.service';
import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';
import {
  VarianteConStock,
  VariantePublica,
  toPublicVariant,
} from '../productos/catalog.types';
import { buildVariantSku } from './sku.util';

@Injectable()
export class VariantesService implements OnModuleInit {
  private readonly logger = new Logger(VariantesService.name);

  constructor(
    @InjectRepository(Variante)
    private readonly varianteRepository: Repository<Variante>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    private readonly stockService: StockService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.dataSource.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS uq_variantes_producto_talle_color_lower ON variantes (producto_id, LOWER(talle), LOWER(color))',
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo crear uq_variantes_producto_talle_color_lower: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findAllPublic(productoId?: string): Promise<VariantePublica[]> {
    const qb = this.varianteRepository
      .createQueryBuilder('v')
      .innerJoin('v.producto', 'p')
      .innerJoin('p.categoria', 'c')
      .where(
        'v.activa = :varActiva AND p.activo = :prodActivo AND c.activa = :catActivo',
        { varActiva: true, prodActivo: true, catActivo: true },
      );

    if (productoId) {
      qb.andWhere('v.producto_id = :productoId', { productoId });
    }

    const variantes = await qb
      .orderBy('v.talle', 'ASC')
      .addOrderBy('v.color', 'ASC')
      .getMany();

    if (variantes.length === 0) {
      return [];
    }

    const stockMap = await this.stockService.getStockByVariants(
      variantes.map((v) => v.id),
    );
    return variantes.map((v) =>
      toPublicVariant({
        ...v,
        stock_actual: stockMap.get(v.id) ?? 0,
      }),
    );
  }

  async findAllAdmin(productoId?: string): Promise<VarianteConStock[]> {
    const where = productoId ? { producto_id: productoId } : {};
    const variantes = await this.varianteRepository.find({
      where,
      order: { talle: 'ASC', color: 'ASC' },
    });
    if (variantes.length === 0) {
      return [];
    }

    const stockMap = await this.stockService.getStockByVariants(
      variantes.map((v) => v.id),
    );
    return variantes.map((v) => ({
      ...v,
      stock_actual: stockMap.get(v.id) ?? 0,
    }));
  }

  async findOnePublic(id: string): Promise<VariantePublica> {
    const variante = await this.varianteRepository
      .createQueryBuilder('v')
      .innerJoin('v.producto', 'p')
      .innerJoin('p.categoria', 'c')
      .where(
        'v.id = :id AND v.activa = :varActiva AND p.activo = :prodActivo AND c.activa = :catActivo',
        { id, varActiva: true, prodActivo: true, catActivo: true },
      )
      .getOne();

    if (!variante) {
      throw new NotFoundException(`Variante con ID ${id} no encontrada.`);
    }

    const stockMap = await this.stockService.getStockByVariants([id]);
    return toPublicVariant({
      ...variante,
      stock_actual: stockMap.get(id) ?? 0,
    });
  }

  async create(dto: CreateVarianteDto): Promise<VarianteConStock> {
    const talle = dto.talle?.trim() ?? '';
    const color = dto.color?.trim() ?? '';
    if (!talle || !color) {
      throw new BadRequestException('Talle y color son obligatorios.');
    }

    const producto = await this.productoRepository.findOne({
      where: { id: dto.producto_id },
    });
    if (!producto) {
      throw new NotFoundException(
        `Producto con ID ${dto.producto_id} no encontrado.`,
      );
    }

    const duplicateCombo = await this.varianteRepository
      .createQueryBuilder('v')
      .where('v.producto_id = :productoId', { productoId: dto.producto_id })
      .andWhere('LOWER(v.talle) = LOWER(:talle)', { talle })
      .andWhere('LOWER(v.color) = LOWER(:color)', { color })
      .getOne();

    if (duplicateCombo) {
      throw new ConflictException(
        `Ya existe una variante talle "${talle}" y color "${color}" para este producto.`,
      );
    }

    const skuVariante =
      dto.sku_variante?.trim().toUpperCase() ||
      buildVariantSku(producto.sku, color, talle);

    const existingSku = await this.varianteRepository.findOne({
      where: { sku_variante: skuVariante },
    });
    if (existingSku) {
      throw new ConflictException(
        `Ya existe una variante registrada con el SKU "${skuVariante}".`,
      );
    }

    const variante = this.varianteRepository.create({
      producto_id: dto.producto_id,
      talle,
      color,
      material: dto.material?.trim() || null,
      sku_variante: skuVariante,
      activa: dto.activa ?? true,
    });

    const saved = await this.varianteRepository.save(variante);
    return {
      ...saved,
      stock_actual: 0,
    };
  }

  async update(id: string, dto: UpdateVarianteDto): Promise<VarianteConStock> {
    const variante = await this.varianteRepository.findOne({ where: { id } });
    if (!variante) {
      throw new NotFoundException(`Variante con ID ${id} no encontrada.`);
    }

    const nextTalle =
      dto.talle !== undefined ? dto.talle.trim() : variante.talle;
    const nextColor =
      dto.color !== undefined ? dto.color.trim() : variante.color;

    if (!nextTalle || !nextColor) {
      throw new BadRequestException('Talle y color no pueden quedar vacíos.');
    }

    if (dto.talle !== undefined || dto.color !== undefined) {
      const conflictCombo = await this.varianteRepository
        .createQueryBuilder('v')
        .where('v.producto_id = :productoId', {
          productoId: variante.producto_id,
        })
        .andWhere('LOWER(v.talle) = LOWER(:talle)', { talle: nextTalle })
        .andWhere('LOWER(v.color) = LOWER(:color)', { color: nextColor })
        .andWhere('v.id != :id', { id })
        .getOne();

      if (conflictCombo) {
        throw new ConflictException(
          `Ya existe otra variante talle "${nextTalle}" y color "${nextColor}" en este producto.`,
        );
      }

      variante.talle = nextTalle;
      variante.color = nextColor;
    }

    if (dto.material !== undefined) {
      variante.material = dto.material.trim() || null;
    }

    if (dto.sku_variante !== undefined) {
      const nextSku = dto.sku_variante.trim().toUpperCase();
      if (!nextSku) {
        throw new BadRequestException('sku_variante no puede quedar vacío.');
      }
      const conflictSku = await this.varianteRepository
        .createQueryBuilder('v')
        .where('v.sku_variante = :sku', { sku: nextSku })
        .andWhere('v.id != :id', { id })
        .getOne();

      if (conflictSku) {
        throw new ConflictException(
          `Ya existe otra variante con el SKU "${nextSku}".`,
        );
      }
      variante.sku_variante = nextSku;
    }

    if (dto.activa !== undefined) {
      variante.activa = dto.activa;
    }

    const saved = await this.varianteRepository.save(variante);
    const stockMap = await this.stockService.getStockByVariants([id]);
    return {
      ...saved,
      stock_actual: stockMap.get(id) ?? 0,
    };
  }

  async remove(id: string): Promise<void> {
    const variante = await this.varianteRepository.findOne({ where: { id } });
    if (!variante) {
      throw new NotFoundException(`Variante con ID ${id} no encontrada.`);
    }

    if (await this.stockService.hasMovements([id])) {
      throw new ConflictException(
        'No se puede eliminar una variante con historial en el libro mayor de stock. Desactivala en su lugar.',
      );
    }

    await this.varianteRepository.remove(variante);
  }
}
