import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { Variante } from '../variantes/entities/variante.entity';
import { StockService } from '../stock/stock.service';
import { TipoMovimiento } from '../stock/enums/tipo-movimiento.enum';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import {
  QueryAdminProductosDto,
  QueryPublicProductosDto,
} from './dto/query-productos.dto';
import {
  PaginatedResult,
  ProductoAdmin,
  ProductoPublico,
  VarianteConStock,
  toPublicProduct,
} from './catalog.types';
import { buildVariantSku, normalizeTags } from '../variantes/sku.util';
import { escapeLike } from '../common/utils/validation.util';

const DEFAULT_PAGE_LIMIT = 24;
const MAX_PAGE_LIMIT = 100;

interface FilterOptions extends QueryPublicProductosDto {
  onlyActive: boolean;
  activo?: 'true' | 'false';
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Variante)
    private readonly varianteRepository: Repository<Variante>,
    private readonly stockService: StockService,
    private readonly dataSource: DataSource,
  ) {}

  async findAllPublic(
    query: QueryPublicProductosDto = {},
  ): Promise<PaginatedResult<ProductoPublico>> {
    const page = await this.findPaginatedAdmin({ ...query, onlyActive: true });
    return {
      ...page,
      items: page.items.map(toPublicProduct),
    };
  }

  async findAllAdmin(
    query: QueryAdminProductosDto = {},
  ): Promise<PaginatedResult<ProductoAdmin>> {
    return this.findPaginatedAdmin({ ...query, onlyActive: false });
  }

  async findOnePublic(id: string): Promise<ProductoPublico> {
    const adminProduct = await this.loadEnrichedProduct(id, false);
    if (!adminProduct.activo || !adminProduct.categoria?.activa) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    return toPublicProduct(adminProduct);
  }

  async findOneAdmin(id: string): Promise<ProductoAdmin> {
    return this.loadEnrichedProduct(id, true);
  }

  async create(dto: CreateProductoDto): Promise<ProductoAdmin> {
    const sku = dto.sku?.trim().toUpperCase() ?? '';
    const nombre = dto.nombre?.trim() ?? '';
    const marca = dto.marca?.trim() ?? '';

    if (!sku || nombre.length < 2 || !marca) {
      throw new BadRequestException(
        'SKU, nombre (mínimo 2 caracteres) y marca son obligatorios.',
      );
    }

    const savedId = await this.dataSource.transaction(async (manager) => {
      const categoria = await manager.findOne(Categoria, {
        where: { id: dto.categoria_id },
      });
      if (!categoria) {
        throw new NotFoundException(
          `Categoría con ID ${dto.categoria_id} no encontrada.`,
        );
      }

      const existingSku = await manager.findOne(Producto, {
        where: { sku },
      });
      if (existingSku) {
        throw new ConflictException(
          `Ya existe un producto con el SKU "${sku}".`,
        );
      }

      const variantesPayload = await this.prepareInitialVariants(
        sku,
        dto.variantes,
        () => manager.createQueryBuilder(Variante, 'v'),
      );

      const producto = manager.create(Producto, {
        sku,
        nombre,
        descripcion: dto.descripcion?.trim() || null,
        marca,
        costo: dto.costo,
        precio: dto.precio,
        garantia: dto.garantia?.trim() || null,
        uso_recomendado: dto.uso_recomendado?.trim() || null,
        etiquetas: normalizeTags(dto.etiquetas),
        imagen_url: dto.imagen_url?.trim() || null,
        activo: dto.activo ?? true,
        categoria_id: dto.categoria_id,
        variantes: variantesPayload.map((v) => manager.create(Variante, v)),
      });

      const saved = await manager.save(Producto, producto);
      return saved.id;
    });

    return this.findOneAdmin(savedId);
  }

  async update(id: string, dto: UpdateProductoDto): Promise<ProductoAdmin> {
    const producto = await this.productoRepository.findOne({ where: { id } });
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }

    if (dto.categoria_id !== undefined) {
      const categoria = await this.categoriaRepository.findOne({
        where: { id: dto.categoria_id },
      });
      if (!categoria) {
        throw new NotFoundException(
          `Categoría con ID ${dto.categoria_id} no encontrada.`,
        );
      }
      producto.categoria_id = dto.categoria_id;
    }

    if (dto.sku !== undefined) {
      const sku = dto.sku.trim().toUpperCase();
      if (!sku) {
        throw new BadRequestException('El SKU no puede estar vacío.');
      }
      const conflict = await this.productoRepository
        .createQueryBuilder('p')
        .where('p.sku = :sku', { sku })
        .andWhere('p.id != :id', { id })
        .getOne();
      if (conflict) {
        throw new ConflictException(
          `Ya existe otro producto con el SKU "${sku}".`,
        );
      }
      producto.sku = sku;
    }

    if (dto.nombre !== undefined) {
      const nombre = dto.nombre.trim();
      if (nombre.length < 2) {
        throw new BadRequestException(
          'El nombre debe tener al menos 2 caracteres.',
        );
      }
      producto.nombre = nombre;
    }

    if (dto.marca !== undefined) {
      const marca = dto.marca.trim();
      if (!marca) {
        throw new BadRequestException('La marca no puede estar vacía.');
      }
      producto.marca = marca;
    }

    if (dto.descripcion !== undefined) {
      producto.descripcion = dto.descripcion.trim() || null;
    }
    if (dto.costo !== undefined) producto.costo = dto.costo;
    if (dto.precio !== undefined) producto.precio = dto.precio;
    if (dto.garantia !== undefined) {
      producto.garantia = dto.garantia.trim() || null;
    }
    if (dto.uso_recomendado !== undefined) {
      producto.uso_recomendado = dto.uso_recomendado.trim() || null;
    }
    if (dto.etiquetas !== undefined) {
      producto.etiquetas = normalizeTags(dto.etiquetas);
    }
    if (dto.imagen_url !== undefined) {
      producto.imagen_url = dto.imagen_url.trim() || null;
    }
    if (dto.activo !== undefined) producto.activo = dto.activo;

    await this.productoRepository.save(producto);
    return this.findOneAdmin(id);
  }

  async remove(id: string): Promise<void> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: { variantes: true },
    });
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }

    const variantIds = (producto.variantes ?? []).map((v) => v.id);
    if (await this.stockService.hasMovements(variantIds)) {
      throw new ConflictException(
        'No se puede eliminar un producto que tiene movimientos registrados en el libro mayor de stock. Desactivalo en su lugar.',
      );
    }

    await this.productoRepository.remove(producto);
  }

  private async findPaginatedAdmin(
    filters: FilterOptions,
  ): Promise<PaginatedResult<ProductoAdmin>> {
    const limit = Math.min(
      Math.max(filters.limit ?? DEFAULT_PAGE_LIMIT, 1),
      MAX_PAGE_LIMIT,
    );
    const offset = Math.max(filters.offset ?? 0, 0);

    const countQb = this.productoRepository.createQueryBuilder('p');
    this.applyFilters(countQb, filters);
    const total = await countQb.getCount();

    if (total === 0) {
      return { items: [], total: 0, limit, offset };
    }

    const idQb = this.productoRepository.createQueryBuilder('p');
    this.applyFilters(idQb, filters);
    idQb.select('p.id', 'id');

    if (filters.onlyActive) {
      idQb
        .addSelect(
          `CASE WHEN COALESCE((SELECT SUM(CASE WHEN sm.tipo_movimiento = :ingreso THEN sm.cantidad ELSE -sm.cantidad END) FROM stock_movements sm INNER JOIN variantes vs ON vs.id = sm.variante_id WHERE vs.producto_id = p.id AND vs.activa = true), 0) > 0 THEN 1 ELSE 0 END`,
          'has_stock',
        )
        .setParameter('ingreso', TipoMovimiento.INGRESO_PROVEEDOR)
        .orderBy('has_stock', 'DESC')
        .addOrderBy('p.created_at', 'DESC');
    } else {
      idQb.orderBy('p.created_at', 'DESC');
    }

    const rawIds = await idQb
      .offset(offset)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const pageIds = rawIds.map((r) => r.id);
    if (pageIds.length === 0) {
      return { items: [], total, limit, offset };
    }

    const productos = await this.productoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c')
      .leftJoinAndSelect('p.variantes', 'v')
      .where('p.id IN (:...ids)', { ids: pageIds })
      .getMany();

    const byId = new Map(productos.map((p) => [p.id, p]));
    const ordered = pageIds
      .map((id) => byId.get(id))
      .filter((p): p is Producto => Boolean(p));

    const allVariantIds = ordered.flatMap((p) =>
      (p.variantes ?? []).map((v) => v.id),
    );
    const stockMap = await this.stockService.getStockByVariants(allVariantIds);

    return {
      items: ordered.map((p) =>
        this.enrichProduct(p, stockMap, !filters.onlyActive),
      ),
      total,
      limit,
      offset,
    };
  }

  private applyFilters(
    qb: SelectQueryBuilder<Producto>,
    filters: FilterOptions,
  ): void {
    if (filters.onlyActive) {
      qb.innerJoin('p.categoria', 'c').andWhere(
        'p.activo = :prodActivo AND c.activa = :catActivo',
        { prodActivo: true, catActivo: true },
      );
    } else if (filters.activo === 'true') {
      qb.andWhere('p.activo = :prodActivo', { prodActivo: true });
    } else if (filters.activo === 'false') {
      qb.andWhere('p.activo = :prodActivo', { prodActivo: false });
    }

    if (filters.categoria_id) {
      qb.andWhere('p.categoria_id = :categoriaId', {
        categoriaId: filters.categoria_id,
      });
    }

    const marca = filters.marca?.trim();
    if (marca) {
      qb.andWhere('LOWER(p.marca) = LOWER(:marca)', { marca });
    }

    const tag = filters.etiqueta?.trim().toLowerCase();
    if (tag) {
      qb.andWhere(
        `(LOWER(:etiqueta) = ANY(p.etiquetas) OR LOWER(COALESCE(p.uso_recomendado, '')) LIKE LOWER(:etiquetaLike) ESCAPE '\\')`,
        { etiqueta: tag, etiquetaLike: `%${escapeLike(tag)}%` },
      );
    }

    const search = filters.search?.trim();
    if (search) {
      qb.andWhere(
        `(p.nombre ILIKE :q ESCAPE '\\' OR p.sku ILIKE :q ESCAPE '\\' OR p.marca ILIKE :q ESCAPE '\\' OR COALESCE(p.descripcion, '') ILIKE :q ESCAPE '\\' OR COALESCE(p.uso_recomendado, '') ILIKE :q ESCAPE '\\' OR array_to_string(p.etiquetas, ' ') ILIKE :q ESCAPE '\\')`,
        { q: `%${escapeLike(search)}%` },
      );
    }
  }

  private async loadEnrichedProduct(
    id: string,
    includeInactiveVariants: boolean,
  ): Promise<ProductoAdmin> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: { categoria: true, variantes: true },
    });
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }

    const variantIds = (producto.variantes ?? []).map((v) => v.id);
    const stockMap = await this.stockService.getStockByVariants(variantIds);
    return this.enrichProduct(producto, stockMap, includeInactiveVariants);
  }

  private enrichProduct(
    producto: Producto,
    stockMap: Map<string, number>,
    includeInactiveVariants: boolean,
  ): ProductoAdmin {
    const allVariants = (producto.variantes ?? []).map<VarianteConStock>(
      (v) => ({
        ...v,
        stock_actual: stockMap.get(v.id) ?? 0,
      }),
    );

    const visibleVariants = (
      includeInactiveVariants
        ? allVariants
        : allVariants.filter((v) => v.activa)
    ).sort(
      (a, b) =>
        a.talle.localeCompare(b.talle, 'es', { numeric: true }) ||
        a.color.localeCompare(b.color, 'es'),
    );

    const stockTotal = visibleVariants.reduce(
      (sum, v) => sum + v.stock_actual,
      0,
    );

    return {
      ...producto,
      variantes: visibleVariants,
      stock_total: stockTotal,
    };
  }

  private async prepareInitialVariants(
    baseSku: string,
    variantes: CreateProductoDto['variantes'],
    createVariantQb: () => SelectQueryBuilder<Variante>,
  ): Promise<
    Array<{
      talle: string;
      color: string;
      material: string | null;
      sku_variante: string;
    }>
  > {
    if (!variantes || variantes.length === 0) {
      return [];
    }

    const pairKeys = new Set<string>();
    const skuKeys = new Set<string>();
    const prepared: Array<{
      talle: string;
      color: string;
      material: string | null;
      sku_variante: string;
    }> = [];

    for (const item of variantes) {
      const talle = item.talle.trim();
      const color = item.color.trim();
      if (!talle || !color) {
        throw new BadRequestException(
          'Cada variante inicial requiere talle y color no vacíos.',
        );
      }

      const pairKey = `${talle.toLowerCase()}::${color.toLowerCase()}`;
      if (pairKeys.has(pairKey)) {
        throw new BadRequestException(
          `La combinación talle "${talle}" y color "${color}" está duplicada.`,
        );
      }
      pairKeys.add(pairKey);

      const skuVariante =
        item.sku_variante?.trim().toUpperCase() ||
        buildVariantSku(baseSku, color, talle);
      if (skuKeys.has(skuVariante)) {
        throw new BadRequestException(
          `El SKU de variante "${skuVariante}" está duplicado en la solicitud.`,
        );
      }
      skuKeys.add(skuVariante);

      prepared.push({
        talle,
        color,
        material: item.material?.trim() || null,
        sku_variante: skuVariante,
      });
    }

    const existingSku = await createVariantQb()
      .where('v.sku_variante IN (:...skus)', { skus: Array.from(skuKeys) })
      .getOne();

    if (existingSku) {
      throw new ConflictException(
        `Ya existe una variante registrada con el SKU "${existingSku.sku_variante}".`,
      );
    }

    return prepared;
  }
}
