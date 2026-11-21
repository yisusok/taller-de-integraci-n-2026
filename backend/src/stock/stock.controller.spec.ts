import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { validate } from 'class-validator';
import { StockController } from './stock.controller';
import { StockService, StockSummary } from './stock.service';
import { StockMovement } from './entities/stock-movement.entity';
import { TipoMovimiento } from './enums/tipo-movimiento.enum';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ManualExtractionDto } from './dto/manual-extraction.dto';
import { UserFromToken } from '../auth/decorators/current-user.decorator';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

describe('StockController y DTOs de Stock (STOCK-03 & TEST-01)', () => {
  let controller: StockController;
  let service: {
    recordMovement: jest.Mock;
    recordManualExtraction: jest.Mock;
    getStockSummary: jest.Mock;
    findAllMovements: jest.Mock;
    getLowStockAlerts: jest.Mock;
  };

  const varianteId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const adminUser: UserFromToken = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'admin@ecommerce.com',
    rol: RolUsuario.ADMINISTRADOR,
  };

  const mockMovement = {
    id: 'mov-uuid-1',
    variante_id: varianteId,
    tipo_movimiento: TipoMovimiento.EXTRACCION_MANUAL,
    cantidad: 2,
    motivo: 'Rotura detectada en control de calidad',
    usuario_id: adminUser.id,
    created_at: new Date(),
  } as StockMovement;

  const mockSummary: StockSummary = {
    variante_id: varianteId,
    existencias_actuales: 18,
    total_ingresos: 25,
    total_ventas: 5,
    total_extracciones_manuales: 2,
  };

  beforeEach(async () => {
    service = {
      recordMovement: jest.fn().mockResolvedValue(mockMovement),
      recordManualExtraction: jest.fn().mockResolvedValue(mockMovement),
      getStockSummary: jest.fn().mockResolvedValue(mockSummary),
      findAllMovements: jest.fn().mockResolvedValue([mockMovement]),
      getLowStockAlerts: jest.fn().mockResolvedValue({
        umbral: 5,
        total_alertas: 1,
        alertas: [
          {
            variante_id: varianteId,
            existencias_actuales: 2,
            total_ingresos: 10,
            total_salidas: 8,
            umbral: 5,
            nivel: 'critico',
          },
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [{ provide: StockService, useValue: service }],
    }).compile();

    controller = module.get<StockController>(StockController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('POST /stock/movimientos → asienta el movimiento a nombre del usuario autenticado', async () => {
    const dto: CreateStockMovementDto = {
      variante_id: varianteId,
      tipo_movimiento: TipoMovimiento.INGRESO_PROVEEDOR,
      cantidad: 10,
      motivo: 'Ingreso proveedor',
    };

    await controller.createMovement(dto, adminUser);

    expect(service.recordMovement).toHaveBeenCalledWith({
      ...dto,
      usuario_id: adminUser.id,
    });
  });

  it('POST /stock/extracciones-manuales → registra extracción manual vinculada al administrador autenticado', async () => {
    const dto: ManualExtractionDto = {
      variante_id: varianteId,
      cantidad: 2,
      motivo: 'Rotura detectada en control de calidad',
    };

    const result = await controller.createManualExtraction(dto, adminUser);

    expect(service.recordManualExtraction).toHaveBeenCalledWith(
      dto,
      adminUser.id,
    );
    expect(result).toEqual(mockMovement);
  });

  it('GET /stock/variantes/:varianteId → devuelve el resumen calculado de existencias', async () => {
    const result = await controller.getStockSummary(varianteId);

    expect(service.getStockSummary).toHaveBeenCalledWith(varianteId);
    expect(result).toEqual(mockSummary);
  });

  it('GET /stock/variantes/:varianteId/movimientos → historial de la variante', async () => {
    const result = await controller.getVariantMovements(varianteId);

    expect(service.findAllMovements).toHaveBeenCalledWith({
      variante_id: varianteId,
      limit: 200,
    });
    expect(result).toHaveLength(1);
  });

  it('GET /stock/movimientos → delega filtros y paginación al servicio', async () => {
    await controller.listMovements(
      10,
      20,
      TipoMovimiento.EXTRACCION_MANUAL,
      varianteId,
    );

    expect(service.findAllMovements).toHaveBeenCalledWith({
      limit: 10,
      offset: 20,
      tipo_movimiento: TipoMovimiento.EXTRACCION_MANUAL,
      variante_id: varianteId,
    });
  });

  it('GET /stock/alertas → delega al servicio con el umbral especificado', async () => {
    const result = await controller.getLowStockAlerts(3);
    expect(service.getLowStockAlerts).toHaveBeenCalledWith(3);
    expect(result.total_alertas).toBe(1);
    expect(result.alertas[0].nivel).toBe('critico');
  });

  it('RBAC → todos los endpoints de StockController requieren estrictamente RolUsuario.ADMINISTRADOR', () => {
    const reflector = new Reflector();
    const handlerNames = [
      'createMovement',
      'createManualExtraction',
      'getLowStockAlerts',
      'getStockSummary',
      'getVariantMovements',
      'listMovements',
    ] as const;

    for (const name of handlerNames) {
      const descriptor = Object.getOwnPropertyDescriptor(
        StockController.prototype,
        name,
      );
      const handler = descriptor?.value as
        ((...args: unknown[]) => unknown) | undefined;
      expect(handler).toBeDefined();
      const roles = reflector.get<RolUsuario[]>(
        ROLES_KEY,
        handler as (...args: unknown[]) => unknown,
      );
      expect(roles).toEqual([RolUsuario.ADMINISTRADOR]);
    }
  });

  describe('Validación de DTOs (class-validator)', () => {
    it('ManualExtractionDto debe aceptar un payload válido', async () => {
      const dto = Object.assign(new ManualExtractionDto(), {
        variante_id: varianteId,
        cantidad: 3,
        motivo: 'Merma de depósito verificada',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('ManualExtractionDto debe rechazar UUID inválido, cantidad <= 0 y motivo muy corto', async () => {
      const dto = Object.assign(new ManualExtractionDto(), {
        variante_id: 'no-es-uuid',
        cantidad: 0,
        motivo: 'abc',
      });

      const errors = await validate(dto);
      const props = errors.map((e) => e.property);
      expect(props).toContain('variante_id');
      expect(props).toContain('cantidad');
      expect(props).toContain('motivo');
    });

    it('CreateStockMovementDto debe rechazar tipo_movimiento fuera del enum', async () => {
      const dto = Object.assign(new CreateStockMovementDto(), {
        variante_id: varianteId,
        tipo_movimiento: 'AJUSTE_DIRECTO' as TipoMovimiento,
        cantidad: 5,
        motivo: 'Intento de tipo inválido',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'tipo_movimiento')).toBe(true);
    });
  });
});
