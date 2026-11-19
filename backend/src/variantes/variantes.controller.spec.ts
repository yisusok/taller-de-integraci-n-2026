import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VariantesController } from './variantes.controller';
import { VariantesService } from './variantes.service';
import { VarianteConStock, VariantePublica } from '../productos/catalog.types';
import { CreateVarianteDto } from './dto/create-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

describe('VariantesController y DTOs (CAT-01)', () => {
  let controller: VariantesController;
  let service: {
    findAllAdmin: jest.Mock;
    findAllPublic: jest.Mock;
    findOnePublic: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const prodId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const varId = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const mockAdminVariante = {
    id: varId,
    producto_id: prodId,
    talle: '41',
    color: 'Blanco',
    sku_variante: 'SNK-01-BLANCO-41',
    activa: true,
    stock_actual: 4,
  } as unknown as VarianteConStock;
  const mockPublicVariante: VariantePublica = {
    id: varId,
    producto_id: prodId,
    talle: '41',
    color: 'Blanco',
    material: null,
    sku_variante: 'SNK-01-BLANCO-41',
    stock_actual: 4,
  };

  beforeEach(async () => {
    service = {
      findAllAdmin: jest.fn().mockResolvedValue([mockAdminVariante]),
      findAllPublic: jest.fn().mockResolvedValue([mockPublicVariante]),
      findOnePublic: jest.fn().mockResolvedValue(mockPublicVariante),
      create: jest.fn().mockResolvedValue(mockAdminVariante),
      update: jest.fn().mockResolvedValue(mockAdminVariante),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariantesController],
      providers: [{ provide: VariantesService, useValue: service }],
    }).compile();

    controller = module.get(VariantesController);
  });

  it('endpoints públicos y admin delegan correctamente al servicio', async () => {
    await controller.findAllPublic(prodId);
    expect(service.findAllPublic).toHaveBeenCalledWith(prodId);

    await controller.findAllAdmin(prodId);
    expect(service.findAllAdmin).toHaveBeenCalledWith(prodId);

    const found = await controller.findOnePublic(varId);
    expect(found.stock_actual).toBe(4);

    await controller.create({
      producto_id: prodId,
      talle: '41',
      color: 'Blanco',
    });
    expect(service.create).toHaveBeenCalledTimes(1);

    await controller.update(varId, { activa: false });
    expect(service.update).toHaveBeenCalledWith(varId, { activa: false });

    await controller.remove(varId);
    expect(service.remove).toHaveBeenCalledWith(varId);
  });

  it('Seguridad → GET públicos con @Public() y /admin + mutaciones con RolUsuario.ADMINISTRADOR', () => {
    const reflector = new Reflector();

    for (const name of ['findAllPublic', 'findOnePublic'] as const) {
      const handler = Object.getOwnPropertyDescriptor(
        VariantesController.prototype,
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
        VariantesController.prototype,
        name,
      )?.value as (...args: unknown[]) => unknown;
      expect(reflector.get<boolean>(IS_PUBLIC_KEY, handler)).toBeUndefined();
      expect(reflector.get<RolUsuario[]>(ROLES_KEY, handler)).toEqual([
        RolUsuario.ADMINISTRADOR,
      ]);
    }
  });

  it('CreateVarianteDto y UpdateVarianteDto rechazan campos vacíos tras trim', async () => {
    const createDto = plainToInstance(CreateVarianteDto, {
      producto_id: 'invalido',
      talle: '   ',
      color: '   ',
    });
    const createErrors = await validate(createDto);
    const props = createErrors.map((e) => e.property);
    expect(props).toContain('producto_id');
    expect(props).toContain('talle');
    expect(props).toContain('color');

    const updateDto = plainToInstance(UpdateVarianteDto, {
      sku_variante: '   ',
    });
    const updateErrors = await validate(updateDto);
    expect(updateErrors.some((e) => e.property === 'sku_variante')).toBe(true);
  });
});
