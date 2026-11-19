import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

describe('CategoriasController y DTOs (CAT-01)', () => {
  let controller: CategoriasController;
  let service: {
    findAll: jest.Mock;
    findOnePublic: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const catId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const mockCategoria = {
    id: catId,
    nombre: 'Deportivas',
    descripcion: 'Calzado técnico para deporte',
    activa: true,
  } as Categoria;

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue([mockCategoria]),
      findOnePublic: jest.fn().mockResolvedValue(mockCategoria),
      create: jest.fn().mockResolvedValue(mockCategoria),
      update: jest.fn().mockResolvedValue(mockCategoria),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasController],
      providers: [{ provide: CategoriasService, useValue: service }],
    }).compile();

    controller = module.get(CategoriasController);
  });

  it('delega lecturas públicas y administrativas al servicio con visibilidad diferenciada', async () => {
    await controller.findAllPublic();
    expect(service.findAll).toHaveBeenCalledWith(true);

    await controller.findAllAdmin();
    expect(service.findAll).toHaveBeenCalledWith(false);

    const found = await controller.findOnePublic(catId);
    expect(service.findOnePublic).toHaveBeenCalledWith(catId);
    expect(found.nombre).toBe('Deportivas');
  });

  it('POST / PATCH / DELETE delegan al servicio', async () => {
    await controller.create({ nombre: 'Deportivas' });
    expect(service.create).toHaveBeenCalledWith({ nombre: 'Deportivas' });

    await controller.update(catId, { activa: false });
    expect(service.update).toHaveBeenCalledWith(catId, { activa: false });

    await controller.remove(catId);
    expect(service.remove).toHaveBeenCalledWith(catId);
  });

  it('Seguridad → rutas públicas con @Public() y admin/mutaciones con RolUsuario.ADMINISTRADOR', () => {
    const reflector = new Reflector();

    for (const name of ['findAllPublic', 'findOnePublic'] as const) {
      const handler = Object.getOwnPropertyDescriptor(
        CategoriasController.prototype,
        name,
      )?.value as (...args: unknown[]) => unknown;
      expect(reflector.get<boolean>(IS_PUBLIC_KEY, handler)).toBe(true);
    }

    for (const name of [
      'findAllAdmin',
      'create',
      'update',
      'remove',
    ] as const) {
      const handler = Object.getOwnPropertyDescriptor(
        CategoriasController.prototype,
        name,
      )?.value as (...args: unknown[]) => unknown;
      expect(reflector.get<boolean>(IS_PUBLIC_KEY, handler)).toBeUndefined();
      expect(reflector.get<RolUsuario[]>(ROLES_KEY, handler)).toEqual([
        RolUsuario.ADMINISTRADOR,
      ]);
    }
  });

  it('CreateCategoriaDto aplica trim y rechaza nombres cortos o vacíos', async () => {
    const dto = plainToInstance(CreateCategoriaDto, { nombre: '   A   ' });
    expect(dto.nombre).toBe('A');
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'nombre')).toBe(true);
  });
});
