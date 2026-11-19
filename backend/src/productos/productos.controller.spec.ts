import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductosController } from './productos.controller';
import { ProductosService } from './productos.service';
import { ProductoAdmin, ProductoPublico } from './catalog.types';
import { CreateProductoDto } from './dto/create-producto.dto';
import { QueryAdminProductosDto } from './dto/query-productos.dto';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

describe('ProductosController y DTOs (CAT-01)', () => {
  let controller: ProductosController;
  let service: {
    findAllAdmin: jest.Mock;
    findOneAdmin: jest.Mock;
    findAllPublic: jest.Mock;
    findOnePublic: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const catId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const prodId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const mockAdmin = {
    id: prodId,
    sku: 'SNK-01',
    nombre: 'Urbana Classic',
    costo: 25000,
    precio: 49999,
  } as unknown as ProductoAdmin;
  const mockPublic = {
    id: prodId,
    sku: 'SNK-01',
    nombre: 'Urbana Classic',
    precio: 49999,
  } as unknown as ProductoPublico;

  beforeEach(async () => {
    service = {
      findAllAdmin: jest.fn().mockResolvedValue({
        items: [mockAdmin],
        total: 1,
        limit: 24,
        offset: 0,
      }),
      findOneAdmin: jest.fn().mockResolvedValue(mockAdmin),
      findAllPublic: jest.fn().mockResolvedValue({
        items: [mockPublic],
        total: 1,
        limit: 24,
        offset: 0,
      }),
      findOnePublic: jest.fn().mockResolvedValue(mockPublic),
      create: jest.fn().mockResolvedValue(mockAdmin),
      update: jest.fn().mockResolvedValue(mockAdmin),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductosController],
      providers: [{ provide: ProductosService, useValue: service }],
    }).compile();

    controller = module.get(ProductosController);
  });

  it('delega rutas públicas y administrativas a los métodos diferenciados del servicio', async () => {
    await controller.findAllPublic({
      search: 'runner',
      categoria_id: catId,
      limit: 12,
    });
    expect(service.findAllPublic).toHaveBeenCalledWith({
      search: 'runner',
      categoria_id: catId,
      limit: 12,
    });

    await controller.findAllAdmin({ activo: 'false' });
    expect(service.findAllAdmin).toHaveBeenCalledWith({ activo: 'false' });

    await controller.findOnePublic(prodId);
    expect(service.findOnePublic).toHaveBeenCalledWith(prodId);

    await controller.findOneAdmin(prodId);
    expect(service.findOneAdmin).toHaveBeenCalledWith(prodId);
  });

  it('Seguridad → GET públicos con @Public() y /admin + mutaciones con RolUsuario.ADMINISTRADOR', () => {
    const reflector = new Reflector();

    for (const name of ['findAllPublic', 'findOnePublic'] as const) {
      const handler = Object.getOwnPropertyDescriptor(
        ProductosController.prototype,
        name,
      )?.value as (...args: unknown[]) => unknown;
      expect(reflector.get<boolean>(IS_PUBLIC_KEY, handler)).toBe(true);
    }

    for (const name of [
      'findAllAdmin',
      'findOneAdmin',
      'create',
      'update',
      'remove',
    ] as const) {
      const handler = Object.getOwnPropertyDescriptor(
        ProductosController.prototype,
        name,
      )?.value as (...args: unknown[]) => unknown;
      expect(reflector.get<boolean>(IS_PUBLIC_KEY, handler)).toBeUndefined();
      expect(reflector.get<RolUsuario[]>(ROLES_KEY, handler)).toEqual([
        RolUsuario.ADMINISTRADOR,
      ]);
    }
  });

  it('CreateProductoDto sanea SKU, rechaza URL insegura, >2 decimales y montos fuera de rango', async () => {
    const dto = plainToInstance(CreateProductoDto, {
      sku: '  snk-01  ',
      nombre: 'Urbana',
      marca: 'Sneackers',
      costo: 10.123,
      precio: 100000000,
      imagen_url: 'javascript:alert(1)',
      categoria_id: 'no-uuid',
    });

    expect(dto.sku).toBe('SNK-01');
    const errors = await validate(dto);
    const props = errors.map((e) => e.property);
    expect(props).toContain('costo');
    expect(props).toContain('precio');
    expect(props).toContain('imagen_url');
    expect(props).toContain('categoria_id');
  });

  it('CreateProductoDto permite imagen_url vacía (sin protocolo) tras trim', async () => {
    const dto = plainToInstance(CreateProductoDto, {
      sku: 'SNK-02',
      nombre: 'Urbana',
      marca: 'Sneackers',
      costo: 100,
      precio: 200,
      imagen_url: '   ',
      categoria_id: catId,
    });

    expect(dto.imagen_url).toBe('');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('QueryAdminProductosDto valida paginación y flag activo estricto', async () => {
    const dto = plainToInstance(QueryAdminProductosDto, {
      limit: '500',
      activo: 'maybe',
    });
    const errors = await validate(dto);
    const props = errors.map((e) => e.property);
    expect(props).toContain('limit');
    expect(props).toContain('activo');
  });
});
