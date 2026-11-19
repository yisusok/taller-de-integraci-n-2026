import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockMovement } from './entities/stock-movement.entity';
import { Variante } from '../variantes/entities/variante.entity';
import { TipoMovimiento } from './enums/tipo-movimiento.enum';

type Totals = Partial<Record<TipoMovimiento, number>>;

const aggregateBuilder = (totals: Totals) => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(
      Object.entries(totals).map(([tipo_movimiento, total]) => ({
        tipo_movimiento,
        total: String(total),
      })),
    ),
  };
  return builder;
};

describe('StockService (motor de eventos de inventario — TEST-01)', () => {
  let service: StockService;
  let repository: {
    find: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let varianteRepository: {
    createQueryBuilder: jest.Mock;
  };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    query: jest.Mock;
    manager: {
      findOne: jest.Mock;
      save: jest.Mock;
      createQueryBuilder: jest.Mock;
    };
  };
  let dataSource: { createQueryRunner: jest.Mock; query: jest.Mock };

  const varianteId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const adminId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const givenStock = (totals: Totals) => {
    queryRunner.manager.createQueryBuilder.mockReturnValue(
      aggregateBuilder(totals),
    );
  };

  const baseInput = (overrides: Record<string, unknown> = {}) => ({
    variante_id: varianteId,
    tipo_movimiento: TipoMovimiento.INGRESO_PROVEEDOR,
    cantidad: 10,
    motivo: 'Recepción de lote',
    usuario_id: adminId,
    ...overrides,
  });

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn().mockResolvedValue({ id: varianteId, activa: true }),
        save: jest.fn().mockImplementation((entity: unknown) => entity),
        createQueryBuilder: jest.fn(),
      },
    };
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      query: jest.fn().mockResolvedValue(undefined),
    };
    repository = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((entity: unknown) => entity),
      createQueryBuilder: jest.fn(),
    };
    varianteRepository = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: getRepositoryToken(StockMovement), useValue: repository },
        { provide: getRepositoryToken(Variante), useValue: varianteRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(StockService);
  });

  describe('recordMovement', () => {
    it('registra un ingreso sin validar saldo ni bloquear la variante, normalizando el motivo', async () => {
      const result = await service.recordMovement(
        baseInput({ motivo: '  Recepción lote 1234  ' }),
      );

      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Variante, {
        where: { id: varianteId },
      });
      expect(repository.create).toHaveBeenCalledWith({
        variante_id: varianteId,
        tipo_movimiento: TipoMovimiento.INGRESO_PROVEEDOR,
        cantidad: 10,
        motivo: 'Recepción lote 1234',
        usuario_id: adminId,
      });
      expect(result.motivo).toBe('Recepción lote 1234');
      expect(queryRunner.query).not.toHaveBeenCalled();
      expect(queryRunner.manager.createQueryBuilder).not.toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('rechaza con NotFoundException y hace rollback si la variante no existe', async () => {
      queryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.recordMovement(baseInput())).rejects.toThrow(
        NotFoundException,
      );
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('bloquea la variante con hashtextextended y registra una venta cuando hay saldo suficiente', async () => {
      givenStock({
        [TipoMovimiento.INGRESO_PROVEEDOR]: 20,
        [TipoMovimiento.VENTA]: 8,
        [TipoMovimiento.EXTRACCION_MANUAL]: 2,
      });

      await service.recordMovement(
        baseInput({ tipo_movimiento: TipoMovimiento.VENTA, cantidad: 5 }),
      );

      expect(queryRunner.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [varianteId],
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('permite una salida por exactamente el saldo disponible (queda en 0)', async () => {
      givenStock({
        [TipoMovimiento.INGRESO_PROVEEDOR]: 10,
        [TipoMovimiento.EXTRACCION_MANUAL]: 3,
      });

      await expect(
        service.recordMovement(
          baseInput({ tipo_movimiento: TipoMovimiento.VENTA, cantidad: 7 }),
        ),
      ).resolves.toBeDefined();
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('rechaza una salida sin saldo suficiente y revierte la transacción', async () => {
      givenStock({ [TipoMovimiento.INGRESO_PROVEEDOR]: 5 });

      await expect(
        service.recordMovement(
          baseInput({ tipo_movimiento: TipoMovimiento.VENTA, cantidad: 10 }),
        ),
      ).rejects.toThrow(/Stock disponible: 5, solicitado: 10/);

      expect(queryRunner.manager.save).not.toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('rechaza una salida de una variante sin movimientos (saldo 0)', async () => {
      givenStock({});

      await expect(
        service.recordMovement(
          baseInput({
            tipo_movimiento: TipoMovimiento.EXTRACCION_MANUAL,
            cantidad: 1,
          }),
        ),
      ).rejects.toThrow(/Stock disponible: 0, solicitado: 1/);
    });

    it.each([0, -3, 2.5])(
      'rechaza la cantidad inválida %p sin abrir transacción',
      async (cantidad) => {
        await expect(
          service.recordMovement(baseInput({ cantidad })),
        ).rejects.toThrow(BadRequestException);
        expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
      },
    );

    it('rechaza un motivo vacío o de solo espacios sin abrir transacción', async () => {
      await expect(
        service.recordMovement(baseInput({ motivo: '    ' })),
      ).rejects.toThrow(BadRequestException);
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('hace rollback y libera la conexión si falla la persistencia', async () => {
      queryRunner.manager.save.mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.recordMovement(baseInput())).rejects.toThrow(
        'DB connection lost',
      );
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordManualExtraction (STOCK-03)', () => {
    const dto = {
      variante_id: varianteId,
      cantidad: 3,
      motivo: '  Calzado con falla en suela  ',
    };

    it('fuerza EXTRACCION_MANUAL y la atribuye al administrador autenticado', async () => {
      givenStock({ [TipoMovimiento.INGRESO_PROVEEDOR]: 15 });

      await service.recordManualExtraction(dto, adminId);

      expect(repository.create).toHaveBeenCalledWith({
        variante_id: varianteId,
        tipo_movimiento: TipoMovimiento.EXTRACCION_MANUAL,
        cantidad: 3,
        motivo: 'Calzado con falla en suela',
        usuario_id: adminId,
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('rechaza una extracción mayor al saldo neto', async () => {
      givenStock({
        [TipoMovimiento.INGRESO_PROVEEDOR]: 10,
        [TipoMovimiento.VENTA]: 6,
        [TipoMovimiento.EXTRACCION_MANUAL]: 2,
      });

      await expect(
        service.recordManualExtraction({ ...dto, cantidad: 4 }, adminId),
      ).rejects.toThrow(/Stock disponible: 2, solicitado: 4/);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('rechaza la operación sin usuario autenticado', async () => {
      await expect(service.recordManualExtraction(dto, '   ')).rejects.toThrow(
        BadRequestException,
      );
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });
  });

  describe('getStockSummary (STOCK-02)', () => {
    const summaryFor = async (totals: Totals) => {
      const builder = aggregateBuilder(totals);
      repository.createQueryBuilder.mockReturnValue(builder);
      const summary = await service.getStockSummary(varianteId);
      return { summary, builder };
    };

    it('devuelve todo en 0 para una variante sin movimientos', async () => {
      const { summary } = await summaryFor({});
      expect(summary).toEqual({
        variante_id: varianteId,
        existencias_actuales: 0,
        total_ingresos: 0,
        total_ventas: 0,
        total_extracciones_manuales: 0,
      });
    });

    it('calcula ingresos − (ventas + extracciones) a partir de totales agregados por la base', async () => {
      const { summary, builder } = await summaryFor({
        [TipoMovimiento.INGRESO_PROVEEDOR]: 75,
        [TipoMovimiento.VENTA]: 25,
        [TipoMovimiento.EXTRACCION_MANUAL]: 8,
      });

      expect(summary).toMatchObject({
        existencias_actuales: 42,
        total_ingresos: 75,
        total_ventas: 25,
        total_extracciones_manuales: 8,
      });
      expect(builder.where).toHaveBeenCalledWith(
        'm.variante_id = :varianteId',
        { varianteId },
      );
      expect(repository.find).not.toHaveBeenCalled();
    });

    it('devuelve saldo 0 cuando las salidas igualan los ingresos', async () => {
      const { summary } = await summaryFor({
        [TipoMovimiento.INGRESO_PROVEEDOR]: 10,
        [TipoMovimiento.VENTA]: 7,
        [TipoMovimiento.EXTRACCION_MANUAL]: 3,
      });
      expect(summary.existencias_actuales).toBe(0);
    });
  });

  describe('getLowStockAlerts (STOCK-04)', () => {
    const makeAlertsBuilder = (rows: unknown[]) => ({
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rows),
    });

    it('consulta variantes activas con LEFT JOIN al ledger, incluye metadatos y clasifica severidad', async () => {
      const mockRawRows = [
        {
          variante_id: 'var-sin-movs',
          producto_id: 'prod-1',
          producto_nombre: 'Runner Pro',
          producto_sku: 'SNK-RUN-01',
          talle: '41',
          color: 'Negro',
          sku_variante: 'SNK-RUN-01-NEGRO-41',
          total_ingresos: '0',
          total_salidas: '0',
          existencias_actuales: '0',
        },
        {
          variante_id: 'var-critica',
          producto_id: 'prod-2',
          producto_nombre: 'Basket Air',
          producto_sku: 'SNK-BSK-02',
          talle: '42',
          color: 'Rojo',
          sku_variante: 'SNK-BSK-02-ROJO-42',
          total_ingresos: '10',
          total_salidas: '8',
          existencias_actuales: '2',
        },
        {
          variante_id: 'var-baja',
          producto_id: 'prod-3',
          producto_nombre: 'Urban Lite',
          producto_sku: 'SNK-URB-03',
          talle: '39',
          color: 'Blanco',
          sku_variante: 'SNK-URB-03-BLANCO-39',
          total_ingresos: '20',
          total_salidas: '16',
          existencias_actuales: '4',
        },
      ];

      const builder = makeAlertsBuilder(mockRawRows);
      varianteRepository.createQueryBuilder.mockReturnValue(builder);

      const result = await service.getLowStockAlerts(5);

      expect(result.umbral).toBe(5);
      expect(result.total_alertas).toBe(3);
      expect(builder.where).toHaveBeenCalledWith(
        'v.activa = :varActiva AND p.activo = :prodActivo',
        { varActiva: true, prodActivo: true },
      );
      expect(builder.setParameter).toHaveBeenCalledWith(
        'ingreso',
        TipoMovimiento.INGRESO_PROVEEDOR,
      );
      expect(result.alertas[0]).toEqual({
        variante_id: 'var-sin-movs',
        producto_id: 'prod-1',
        producto_nombre: 'Runner Pro',
        producto_sku: 'SNK-RUN-01',
        talle: '41',
        color: 'Negro',
        sku_variante: 'SNK-RUN-01-NEGRO-41',
        existencias_actuales: 0,
        total_ingresos: 0,
        total_salidas: 0,
        umbral: 5,
        nivel: 'agotado',
      });
      expect(result.alertas[1].nivel).toBe('critico');
      expect(result.alertas[2].nivel).toBe('bajo');
      expect(builder.having).toHaveBeenCalledWith(
        expect.stringContaining('<= :umbral'),
        { umbral: 5 },
      );
    });

    it('acota umbrales negativos o fuera de rango a valores seguros', async () => {
      const builder = makeAlertsBuilder([]);
      varianteRepository.createQueryBuilder.mockReturnValue(builder);

      const resNeg = await service.getLowStockAlerts(-10);
      expect(resNeg.umbral).toBe(0);

      const resOverflow = await service.getLowStockAlerts(9999);
      expect(resOverflow.umbral).toBe(1000);
    });
  });

  describe('getStockByVariants & hasMovements (integración catálogo)', () => {
    it('getStockByVariants retorna Map vacío sin consultar la base si recibe arreglo vacío', async () => {
      const map = await service.getStockByVariants([]);
      expect(map.size).toBe(0);
      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('getStockByVariants deduplica IDs y retorna el saldo calculado por variante en una sola query parametrizada', async () => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { variante_id: 'v-1', existencias_actuales: '12' },
          { variante_id: 'v-2', existencias_actuales: '0' },
        ]),
      };
      repository.createQueryBuilder.mockReturnValue(builder);

      const map = await service.getStockByVariants(['v-1', 'v-2', 'v-1']);

      expect(builder.where).toHaveBeenCalledWith('m.variante_id IN (:...ids)', {
        ids: ['v-1', 'v-2'],
      });
      expect(builder.setParameter).toHaveBeenCalledWith(
        'ingreso',
        TipoMovimiento.INGRESO_PROVEEDOR,
      );
      expect(map.get('v-1')).toBe(12);
      expect(map.get('v-2')).toBe(0);
      expect(map.size).toBe(2);
    });

    it('hasMovements devuelve false para lista vacía o conteo 0 y true cuando hay movimientos', async () => {
      expect(await service.hasMovements([])).toBe(false);
      expect(repository.createQueryBuilder).not.toHaveBeenCalled();

      const builder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(0),
      };
      repository.createQueryBuilder.mockReturnValue(builder);

      expect(await service.hasMovements(['v-1'])).toBe(true);
      expect(await service.hasMovements(['v-1'])).toBe(false);
    });
  });

  describe('findAllMovements (auditoría)', () => {
    it('aplica paginación por defecto y orden descendente', async () => {
      await service.findAllMovements();

      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { created_at: 'DESC' },
        take: 50,
        skip: 0,
      });
    });

    it('filtra por tipo y por variante', async () => {
      await service.findAllMovements({
        limit: 20,
        offset: 40,
        tipo_movimiento: TipoMovimiento.EXTRACCION_MANUAL,
        variante_id: varianteId,
      });

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          tipo_movimiento: TipoMovimiento.EXTRACCION_MANUAL,
          variante_id: varianteId,
        },
        order: { created_at: 'DESC' },
        take: 20,
        skip: 40,
      });
    });

    it('acota límites y offsets fuera de rango', async () => {
      await service.findAllMovements({ limit: 999, offset: -10 });
      expect(repository.find).toHaveBeenLastCalledWith(
        expect.objectContaining({ take: 200, skip: 0 }),
      );

      await service.findAllMovements({ limit: 0, offset: 15 });
      expect(repository.find).toHaveBeenLastCalledWith(
        expect.objectContaining({ take: 1, skip: 15 }),
      );
    });
  });

  describe('Inmutabilidad (append-only)', () => {
    it('la entidad impide UPDATE y DELETE', () => {
      const movement = new StockMovement();
      expect(() => movement.preventUpdate()).toThrow(/inmutables/);
      expect(() => movement.preventRemove()).toThrow(/inmutables/);
    });

    it('al iniciar el módulo instala atómicamente el trigger que bloquea UPDATE/DELETE', async () => {
      await service.onModuleInit();

      const statements = (dataSource.query.mock.calls as unknown[][]).map(
        ([sql]) => String(sql),
      );
      expect(statements).toHaveLength(2);
      expect(statements[0]).toContain('fn_prevent_stock_movement_mutation');
      expect(statements[1]).toContain('CREATE OR REPLACE TRIGGER');
      expect(statements[1]).toContain('BEFORE UPDATE OR DELETE');
    });

    it('no interrumpe el arranque si no puede instalar el trigger', async () => {
      dataSource.query.mockRejectedValue(new Error('sin permisos'));
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });
});
