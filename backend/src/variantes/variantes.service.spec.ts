import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { VariantesService } from './variantes.service';
import { Variante } from './entities/variante.entity';
import { Producto } from '../productos/entities/producto.entity';
import { StockService } from '../stock/stock.service';

describe('VariantesService (CAT-01)', () => {
  let service: VariantesService;
  let varianteRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let productoRepo: { findOne: jest.Mock };
  let stockService: { getStockByVariants: jest.Mock; hasMovements: jest.Mock };
  let dataSource: { query: jest.Mock };

  const prodId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const varId = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  const qbReturning = (result: Variante | null) => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
    getMany: jest.fn().mockResolvedValue(result ? [result] : []),
  });

  beforeEach(async () => {
    varianteRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((v: Partial<Variante>) => ({
        id: varId,
        ...v,
      })),
      save: jest.fn().mockImplementation((v: Variante) => Promise.resolve(v)),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(qbReturning(null)),
    };
    productoRepo = {
      findOne: jest.fn().mockResolvedValue({ id: prodId, sku: 'SNK-BASKET' }),
    };
    stockService = {
      getStockByVariants: jest.fn().mockResolvedValue(new Map([[varId, 9]])),
      hasMovements: jest.fn().mockResolvedValue(false),
    };
    dataSource = {
      query: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariantesService,
        { provide: getRepositoryToken(Variante), useValue: varianteRepo },
        { provide: getRepositoryToken(Producto), useValue: productoRepo },
        { provide: StockService, useValue: stockService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(VariantesService);
  });

  it('onModuleInit crea el índice único funcional LOWER(talle), LOWER(color)', async () => {
    await service.onModuleInit();
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('uq_variantes_producto_talle_color_lower'),
    );
  });

  describe('create', () => {
    it('genera sku_variante automáticamente y devuelve stock_actual inicial 0', async () => {
      const created = await service.create({
        producto_id: prodId,
        talle: '42',
        color: 'Azul Eléctrico',
        material: 'Cuero sintético',
      });

      expect(created.sku_variante).toBe('SNK-BASKET-AZUL-ELECTRICO-42');
      expect(created.stock_actual).toBe(0);
    });

    it('rechaza si el producto padre no existe o si ya existe talle+color o sku_variante', async () => {
      productoRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.create({ producto_id: prodId, talle: '42', color: 'Negro' }),
      ).rejects.toThrow(NotFoundException);

      varianteRepo.createQueryBuilder.mockReturnValueOnce(
        qbReturning({ id: varId } as Variante),
      );
      await expect(
        service.create({ producto_id: prodId, talle: '42', color: 'Negro' }),
      ).rejects.toThrow(ConflictException);

      varianteRepo.findOne.mockResolvedValueOnce({
        id: 'otro',
        sku_variante: 'SNK-BASKET-NEGRO-42',
      });
      await expect(
        service.create({ producto_id: prodId, talle: '42', color: 'Negro' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllPublic, findOnePublic & findAllAdmin', () => {
    it('findAllPublic filtra variantes/productos/categorías activas y no expone relación producto ni costo', async () => {
      const qb = qbReturning({
        id: varId,
        producto_id: prodId,
        talle: '41',
        color: 'Negro',
        material: 'Mesh',
        sku_variante: 'SNK-41',
        activa: true,
        producto: { id: prodId, costo: 15000 } as Producto,
      } as Variante);
      varianteRepo.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findAllPublic(prodId);

      expect(qb.where).toHaveBeenCalledWith(
        'v.activa = :varActiva AND p.activo = :prodActivo AND c.activa = :catActivo',
        { varActiva: true, prodActivo: true, catActivo: true },
      );
      expect(res[0].stock_actual).toBe(9);
      expect('producto' in res[0]).toBe(false);
    });

    it('findOnePublic lanza NotFoundException si la variante o su producto están inactivos', async () => {
      varianteRepo.createQueryBuilder.mockReturnValue(qbReturning(null));
      await expect(service.findOnePublic(varId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('findAllAdmin devuelve todas las variantes con stock calculado', async () => {
      varianteRepo.find.mockResolvedValue([
        { id: varId, producto_id: prodId, activa: false },
      ]);
      const res = await service.findAllAdmin(prodId);
      expect(res).toHaveLength(1);
      expect(res[0].stock_actual).toBe(9);
    });
  });

  describe('update & remove', () => {
    it('actualiza variante y adjunta saldo calculado actualizado', async () => {
      varianteRepo.findOne.mockResolvedValue({
        id: varId,
        producto_id: prodId,
        talle: '42',
        color: 'Negro',
        sku_variante: 'SNK-42',
        activa: true,
      });

      const updated = await service.update(varId, { activa: false });
      expect(updated.activa).toBe(false);
      expect(updated.stock_actual).toBe(9);
    });

    it('rechaza vaciar sku_variante al actualizar', async () => {
      varianteRepo.findOne.mockResolvedValue({
        id: varId,
        producto_id: prodId,
        talle: '42',
        color: 'Negro',
        sku_variante: 'SNK-42',
      });

      await expect(
        service.update(varId, { sku_variante: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('impide eliminar variante con historial en stock_movements', async () => {
      varianteRepo.findOne.mockResolvedValue({ id: varId });
      stockService.hasMovements.mockResolvedValue(true);

      await expect(service.remove(varId)).rejects.toThrow(ConflictException);
      expect(varianteRepo.remove).not.toHaveBeenCalled();
    });
  });
});
