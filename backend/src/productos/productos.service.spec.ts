import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { Producto } from './entities/producto.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { Variante } from '../variantes/entities/variante.entity';
import { StockService } from '../stock/stock.service';

describe('ProductosService (CAT-01)', () => {
  let service: ProductosService;
  let productoRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let categoriaRepo: { findOne: jest.Mock };
  let varianteRepo: { create: jest.Mock };
  let stockService: { getStockByVariants: jest.Mock; hasMovements: jest.Mock };
  let txManager: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };

  const catId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const prodId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const var1 = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const var2 = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  const makeProduct = (overrides: Partial<Producto> = {}): Producto =>
    ({
      id: prodId,
      sku: 'SNK-RUN-01',
      nombre: 'Runner Pro',
      descripcion: 'Zapatilla de running',
      marca: 'Sneackers',
      costo: 40000,
      precio: 79999,
      garantia: '6 meses',
      uso_recomendado: 'Running asfalto',
      etiquetas: ['running', 'asfalto'],
      imagen_url: null,
      activo: true,
      categoria_id: catId,
      categoria: {
        id: catId,
        nombre: 'Deportivas',
        descripcion: 'Calzado técnico',
        activa: true,
      } as Categoria,
      variantes: [
        {
          id: var1,
          producto_id: prodId,
          talle: '41',
          color: 'Negro',
          material: 'Mesh',
          sku_variante: 'SNK-RUN-01-NEGRO-41',
          activa: true,
        } as Variante,
      ],
      created_at: new Date('2026-11-19T10:00:00Z'),
      ...overrides,
    }) as Producto;

  beforeEach(async () => {
    productoRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((v: Producto) => Promise.resolve(v)),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };
    categoriaRepo = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: catId, nombre: 'Deportivas', activa: true }),
    };
    varianteRepo = {
      create: jest.fn(),
    };
    stockService = {
      getStockByVariants: jest.fn().mockResolvedValue(new Map([[var1, 7]])),
      hasMovements: jest.fn().mockResolvedValue(false),
    };
    txManager = {
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((_cls, v: Record<string, unknown>) => ({
          id: prodId,
          ...v,
        })),
      save: jest
        .fn()
        .mockImplementation((_cls, v: Producto) =>
          Promise.resolve({ id: prodId, ...v }),
        ),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: typeof txManager) => Promise<string>) =>
          cb(txManager),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        { provide: getRepositoryToken(Producto), useValue: productoRepo },
        { provide: getRepositoryToken(Categoria), useValue: categoriaRepo },
        { provide: getRepositoryToken(Variante), useValue: varianteRepo },
        { provide: StockService, useValue: stockService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ProductosService);
  });

  describe('create', () => {
    it('crea producto dentro de una transacción normalizando SKU, etiquetas y variantes iniciales', async () => {
      txManager.findOne
        .mockResolvedValueOnce({ id: catId, nombre: 'Deportivas' })
        .mockResolvedValueOnce(null);
      productoRepo.findOne.mockResolvedValueOnce(makeProduct());

      const created = await service.create({
        sku: '  snk-run-01 ',
        nombre: 'Runner Pro',
        marca: 'Sneackers',
        costo: 40000,
        precio: 79999,
        categoria_id: catId,
        etiquetas: [' Running ', 'running', 'Asfalto'],
        variantes: [{ talle: '41', color: 'Negro', material: 'Mesh' }],
      });

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(txManager.create).toHaveBeenCalledWith(Variante, {
        talle: '41',
        color: 'Negro',
        material: 'Mesh',
        sku_variante: 'SNK-RUN-01-NEGRO-41',
      });
      expect(created.stock_total).toBe(7);
      expect(created.costo).toBe(40000);
    });

    it('rechaza si la categoría no existe o el SKU ya está ocupado', async () => {
      txManager.findOne.mockResolvedValueOnce(null);
      await expect(
        service.create({
          sku: 'SNK-01',
          nombre: 'Urbana',
          marca: 'Sneackers',
          costo: 10,
          precio: 20,
          categoria_id: catId,
        }),
      ).rejects.toThrow(NotFoundException);

      txManager.findOne
        .mockResolvedValueOnce({ id: catId })
        .mockResolvedValueOnce(makeProduct());
      await expect(
        service.create({
          sku: 'SNK-RUN-01',
          nombre: 'Urbana',
          marca: 'Sneackers',
          costo: 10,
          precio: 20,
          categoria_id: catId,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza variantes iniciales repetidas en el mismo payload', async () => {
      txManager.findOne
        .mockResolvedValueOnce({ id: catId })
        .mockResolvedValueOnce(null);
      await expect(
        service.create({
          sku: 'SNK-RUN-01',
          nombre: 'Runner',
          marca: 'Sneackers',
          costo: 10,
          precio: 20,
          categoria_id: catId,
          variantes: [
            { talle: '40', color: 'Negro' },
            { talle: '40', color: 'negro' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllPublic & findAllAdmin', () => {
    const setupPaginatedBuilders = (
      total: number,
      pageIds: string[],
      entities: Producto[],
    ) => {
      const countQb = {
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(total),
      };
      const idQb = {
        innerJoin: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(pageIds.map((id) => ({ id }))),
      };
      const loadQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(entities),
      };

      productoRepo.createQueryBuilder
        .mockReturnValueOnce(countQb)
        .mockReturnValueOnce(idQb)
        .mockReturnValueOnce(loadQb);

      return { countQb, idQb, loadQb };
    };

    it('findAllPublic pagina en SQL, escapa wildcards LIKE, oculta costo/inactivos y preserva orden has_stock', async () => {
      const conStock = makeProduct({
        id: 'p-con-stock',
        nombre: 'Disponible',
        costo: 12000,
        variantes: [
          {
            id: var2,
            activa: true,
            talle: '42',
            color: 'Azul',
            material: null,
            sku_variante: 'S-2',
          } as Variante,
          {
            id: 'v-inactiva',
            activa: false,
            talle: '43',
            color: 'Gris',
            material: null,
            sku_variante: 'S-3',
          } as Variante,
        ],
      });
      const sinStock = makeProduct({
        id: 'p-sin-stock',
        nombre: 'Agotada',
        variantes: [
          {
            id: var1,
            activa: true,
            talle: '41',
            color: 'Negro',
            material: null,
            sku_variante: 'S-1',
          } as Variante,
        ],
      });

      const { countQb, idQb } = setupPaginatedBuilders(
        2,
        ['p-con-stock', 'p-sin-stock'],
        [sinStock, conStock],
      );
      stockService.getStockByVariants.mockResolvedValue(
        new Map([
          [var1, 0],
          [var2, 5],
        ]),
      );

      const page = await service.findAllPublic({
        search: '100%_test',
        categoria_id: catId,
        limit: 10,
        offset: 0,
      });

      expect(countQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining("ESCAPE '\\'"),
        { q: '%100\\%\\_test%' },
      );
      expect(idQb.orderBy).toHaveBeenCalledWith('has_stock', 'DESC');
      expect(page.total).toBe(2);
      expect(page.items.map((i) => i.id)).toEqual([
        'p-con-stock',
        'p-sin-stock',
      ]);
      expect(page.items[0].variantes).toHaveLength(1);
      expect('costo' in page.items[0]).toBe(false);
      expect('activo' in page.items[0]).toBe(false);
    });

    it('findAllAdmin incluye costo, estado activo y filtros admin', async () => {
      const inactive = makeProduct({
        id: 'p-inact',
        activo: false,
        costo: 33000,
      });
      const { countQb } = setupPaginatedBuilders(1, ['p-inact'], [inactive]);

      const page = await service.findAllAdmin({ activo: 'false' });

      expect(countQb.andWhere).toHaveBeenCalledWith('p.activo = :prodActivo', {
        prodActivo: false,
      });
      expect(page.items[0].costo).toBe(33000);
      expect(page.items[0].activo).toBe(false);
    });
  });

  describe('findOnePublic & remove', () => {
    it('findOnePublic rechaza productos inactivos o de categorías inactivas y oculta costo', async () => {
      productoRepo.findOne.mockResolvedValueOnce(
        makeProduct({ activo: false }),
      );
      await expect(service.findOnePublic(prodId)).rejects.toThrow(
        NotFoundException,
      );

      productoRepo.findOne.mockResolvedValueOnce(
        makeProduct({
          categoria: {
            id: catId,
            nombre: 'Deportivas',
            activa: false,
          } as Categoria,
        }),
      );
      await expect(service.findOnePublic(prodId)).rejects.toThrow(
        NotFoundException,
      );

      productoRepo.findOne.mockResolvedValueOnce(makeProduct());
      const pub = await service.findOnePublic(prodId);
      expect('costo' in pub).toBe(false);
      expect(pub.precio).toBe(79999);
    });

    it('bloquea el borrado si alguna variante tiene movimientos en el ledger de stock', async () => {
      productoRepo.findOne.mockResolvedValue(makeProduct());
      stockService.hasMovements.mockResolvedValue(true);

      await expect(service.remove(prodId)).rejects.toThrow(ConflictException);
      expect(productoRepo.remove).not.toHaveBeenCalled();
    });

    it('elimina el producto cuando no registra movimientos históricos de stock', async () => {
      const entity = makeProduct();
      productoRepo.findOne.mockResolvedValue(entity);
      stockService.hasMovements.mockResolvedValue(false);

      await service.remove(prodId);
      expect(productoRepo.remove).toHaveBeenCalledWith(entity);
    });
  });
});
