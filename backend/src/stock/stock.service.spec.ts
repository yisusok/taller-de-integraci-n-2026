import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockMovement } from './entities/stock-movement.entity';
import { TipoMovimiento } from './enums/tipo-movimiento.enum';

interface MockQueryRunner {
  connect: jest.Mock;
  startTransaction: jest.Mock;
  commitTransaction: jest.Mock;
  rollbackTransaction: jest.Mock;
  release: jest.Mock;
  manager: {
    find: jest.Mock;
    save: jest.Mock;
  };
}

describe('StockService', () => {
  let service: StockService;
  let repository: Partial<Record<keyof Repository<StockMovement>, jest.Mock>>;
  let mockQueryRunner: MockQueryRunner;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        find: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    repository = {
      find: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(StockMovement),
          useValue: repository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('debe registrar un INGRESO_PROVEEDOR exitosamente', async () => {
    const dto = {
      variante_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      tipo_movimiento: TipoMovimiento.INGRESO_PROVEEDOR,
      cantidad: 20,
      motivo: 'Recepción lote 1234',
    };

    const createdMovement = { ...dto, id: 'some-uuid', created_at: new Date() };
    (repository.create as jest.Mock).mockReturnValue(createdMovement);
    mockQueryRunner.manager.save.mockResolvedValue(createdMovement);

    const result = await service.recordMovement(dto);

    expect(result).toEqual(createdMovement);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('debe rechazar una VENTA si no hay existencias suficientes', async () => {
    const dto = {
      variante_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      tipo_movimiento: TipoMovimiento.VENTA,
      cantidad: 10,
      motivo: 'Orden #55',
    };

    // Stock previo disponible: 5
    mockQueryRunner.manager.find.mockResolvedValue([
      { tipo_movimiento: TipoMovimiento.INGRESO_PROVEEDOR, cantidad: 5 },
    ]);

    await expect(service.recordMovement(dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('debe calcular existencias consolidadas correctamente en getStockSummary', async () => {
    const varianteId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    (repository.find as jest.Mock).mockResolvedValue([
      { tipo_movimiento: TipoMovimiento.INGRESO_PROVEEDOR, cantidad: 50 },
      { tipo_movimiento: TipoMovimiento.VENTA, cantidad: 15 },
      { tipo_movimiento: TipoMovimiento.EXTRACCION_MANUAL, cantidad: 5 },
    ]);

    const summary = await service.getStockSummary(varianteId);

    expect(summary.total_ingresos).toBe(50);
    expect(summary.total_ventas).toBe(15);
    expect(summary.total_extracciones_manuales).toBe(5);
    expect(summary.existencias_actuales).toBe(30); // 50 - 15 - 5 = 30
  });

  it('debe impedir mutaciones directas sobre la entidad StockMovement', () => {
    const movement = new StockMovement();
    expect(() => movement.preventUpdate()).toThrow(/inmutables/);
    expect(() => movement.preventRemove()).toThrow(/inmutables/);
  });
});
