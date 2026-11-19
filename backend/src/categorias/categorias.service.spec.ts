import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { Categoria } from './entities/categoria.entity';
import { Producto } from '../productos/entities/producto.entity';

describe('CategoriasService (CAT-01)', () => {
  let service: CategoriasService;
  let categoriaRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let productoRepo: {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let dataSource: { query: jest.Mock };

  const catId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const mockQueryBuilder = (result: Categoria | null) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  });

  beforeEach(async () => {
    categoriaRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((v: Partial<Categoria>) => ({
        id: catId,
        ...v,
      })),
      save: jest.fn().mockImplementation((v: Categoria) => Promise.resolve(v)),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };
    productoRepo = {
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(),
    };
    dataSource = {
      query: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasService,
        { provide: getRepositoryToken(Categoria), useValue: categoriaRepo },
        { provide: getRepositoryToken(Producto), useValue: productoRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(CategoriasService);
  });

  describe('onModuleInit', () => {
    it('crea de forma idempotente el índice único funcional LOWER(nombre)', async () => {
      await service.onModuleInit();
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('uq_categorias_nombre_lower'),
      );
    });

    it('no interrumpe el arranque si la base aún no está lista para indexar', async () => {
      dataSource.query.mockRejectedValue(new Error('tabla aún no creada'));
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('create', () => {
    it('crea una categoría normalizando nombre y descripción', async () => {
      categoriaRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(null));

      const created = await service.create({
        nombre: '  Urbanas  ',
        descripcion: '  Calzado urbano diario  ',
      });

      expect(created.nombre).toBe('Urbanas');
      expect(created.descripcion).toBe('Calzado urbano diario');
      expect(created.activa).toBe(true);
      expect(categoriaRepo.save).toHaveBeenCalledTimes(1);
    });

    it('rechaza con ConflictException si ya existe una categoría con el mismo nombre', async () => {
      categoriaRepo.createQueryBuilder.mockReturnValue(
        mockQueryBuilder({ id: catId, nombre: 'Urbanas' } as Categoria),
      );

      await expect(service.create({ nombre: 'urbanas' })).rejects.toThrow(
        ConflictException,
      );
      expect(categoriaRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll & findOnePublic', () => {
    it('filtra categorías activas y cuenta solo productos activos en modo público', async () => {
      categoriaRepo.find.mockResolvedValue([
        { id: catId, nombre: 'Deportivas', activa: true },
      ]);
      const countQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ categoria_id: catId, total: '4' }]),
      };
      productoRepo.createQueryBuilder.mockReturnValue(countQb);

      const res = await service.findAll(true);

      expect(categoriaRepo.find).toHaveBeenCalledWith({
        where: { activa: true },
        order: { nombre: 'ASC' },
      });
      expect(countQb.andWhere).toHaveBeenCalledWith('p.activo = :prodActivo', {
        prodActivo: true,
      });
      expect(res[0].productos_count).toBe(4);
    });

    it('findOnePublic rechaza con NotFoundException si la categoría no existe o está inactiva', async () => {
      categoriaRepo.findOne.mockResolvedValue(null);
      await expect(service.findOnePublic(catId)).rejects.toThrow(
        NotFoundException,
      );
      expect(categoriaRepo.findOne).toHaveBeenCalledWith({
        where: { id: catId, activa: true },
      });
    });

    it('devuelve arreglo vacío sin consultar conteos cuando no hay categorías', async () => {
      categoriaRepo.find.mockResolvedValue([]);
      const res = await service.findAll();
      expect(res).toEqual([]);
      expect(productoRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('update & remove', () => {
    it('lanza NotFoundException al actualizar una categoría inexistente', async () => {
      categoriaRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update(catId, { nombre: 'Casuales' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('impide eliminar una categoría que tiene productos asociados', async () => {
      categoriaRepo.findOne.mockResolvedValue({ id: catId, nombre: 'Urbanas' });
      productoRepo.count.mockResolvedValue(2);

      await expect(service.remove(catId)).rejects.toThrow(ConflictException);
      expect(categoriaRepo.remove).not.toHaveBeenCalled();
    });

    it('elimina la categoría cuando no tiene productos asociados', async () => {
      const entity = { id: catId, nombre: 'Accesorios' } as Categoria;
      categoriaRepo.findOne.mockResolvedValue(entity);
      productoRepo.count.mockResolvedValue(0);

      await service.remove(catId);
      expect(categoriaRepo.remove).toHaveBeenCalledWith(entity);
    });
  });
});
