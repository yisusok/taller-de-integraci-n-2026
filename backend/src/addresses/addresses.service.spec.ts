import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { AddressesService, MAX_ADDRESSES_PER_USER } from './addresses.service';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';

describe('AddressesService (Libreta de Direcciones - Límite 3)', () => {
  let service: AddressesService;
  let repository: jest.Mocked<Partial<Repository<Address>>>;

  const userId = 'user-uuid-123';

  const mockAddress: Address = {
    id: 'addr-uuid-1',
    userId,
    alias: 'Casa',
    calle: 'Av. Corrientes',
    numero: '1234',
    pisoDepto: '4B',
    ciudad: 'Buenos Aires',
    provincia: 'CABA',
    codigoPostal: 'C1043',
    esPredeterminada: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: getRepositoryToken(Address), useValue: repository },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const dto: CreateAddressDto = {
      alias: 'Trabajo',
      calle: 'San Martín',
      numero: '500',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      codigoPostal: '2000',
    };

    it('registra el primer domicilio y lo asigna automáticamente como predeterminado', async () => {
      (repository.count as jest.Mock).mockResolvedValue(0);
      (repository.create as jest.Mock).mockImplementation(
        (data: DeepPartial<Address>) =>
          ({
            id: 'new-id',
            ...data,
          }) as Address,
      );
      (repository.save as jest.Mock).mockImplementation((a: Address) =>
        Promise.resolve(a),
      );

      const result = await service.create(userId, dto);

      expect(repository.count).toHaveBeenCalledWith({ where: { userId } });
      expect(result.esPredeterminada).toBe(true);
      expect(result.alias).toBe('Trabajo');
    });

    it('registra un segundo domicilio sin marcar como predeterminado si no se solicitó', async () => {
      (repository.count as jest.Mock).mockResolvedValue(1);
      (repository.create as jest.Mock).mockImplementation(
        (data: DeepPartial<Address>) =>
          ({
            id: 'new-id',
            ...data,
          }) as Address,
      );
      (repository.save as jest.Mock).mockImplementation((a: Address) =>
        Promise.resolve(a),
      );

      const result = await service.create(userId, {
        ...dto,
        esPredeterminada: false,
      });

      expect(result.esPredeterminada).toBe(false);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('desmarca los domicilios anteriores si el nuevo se registra como predeterminado', async () => {
      (repository.count as jest.Mock).mockResolvedValue(2);
      (repository.update as jest.Mock).mockResolvedValue({ affected: 2 });
      (repository.create as jest.Mock).mockImplementation(
        (data: DeepPartial<Address>) =>
          ({
            id: 'new-id',
            ...data,
          }) as Address,
      );
      (repository.save as jest.Mock).mockImplementation((a: Address) =>
        Promise.resolve(a),
      );

      const result = await service.create(userId, {
        ...dto,
        esPredeterminada: true,
      });

      expect(repository.update).toHaveBeenCalledWith(
        { userId },
        { esPredeterminada: false },
      );
      expect(result.esPredeterminada).toBe(true);
    });

    it(`lanza BadRequestException si el cliente ya alcanzó el límite máximo de ${MAX_ADDRESSES_PER_USER} domicilios`, async () => {
      (repository.count as jest.Mock).mockResolvedValue(MAX_ADDRESSES_PER_USER);

      await expect(service.create(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('retorna la lista de domicilios del usuario ordenada', async () => {
      (repository.find as jest.Mock).mockResolvedValue([mockAddress]);

      const result = await service.findAll(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { esPredeterminada: 'DESC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockAddress.id);
    });
  });

  describe('findOne()', () => {
    it('retorna el domicilio si existe y pertenece al usuario', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(mockAddress);

      const result = await service.findOne(userId, mockAddress.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockAddress.id, userId },
      });
      expect(result).toEqual(mockAddress);
    });

    it('lanza NotFoundException si el domicilio no existe o es de otro usuario', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userId, 'otra-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setDefault()', () => {
    it('desmarca todos los domicilios y asigna el indicado como predeterminado', async () => {
      const addressToSet = { ...mockAddress, esPredeterminada: false };
      (repository.findOne as jest.Mock).mockResolvedValue({ ...addressToSet });
      (repository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (repository.save as jest.Mock).mockImplementation((a: Address) =>
        Promise.resolve(a),
      );

      const result = await service.setDefault(userId, addressToSet.id);

      expect(repository.update).toHaveBeenCalledWith(
        { userId },
        { esPredeterminada: false },
      );
      expect(result.esPredeterminada).toBe(true);
    });
  });

  describe('remove()', () => {
    it('elimina un domicilio no predeterminado sin reasignar predeterminada', async () => {
      const secondaryAddress = { ...mockAddress, esPredeterminada: false };
      (repository.findOne as jest.Mock).mockResolvedValue({
        ...secondaryAddress,
      });
      (repository.remove as jest.Mock).mockResolvedValue(secondaryAddress);

      const result = await service.remove(userId, secondaryAddress.id);

      expect(repository.remove).toHaveBeenCalled();
      expect(result.message).toContain('eliminado exitosamente');
    });

    it('elimina el domicilio predeterminado y reasigna automáticamente el siguiente restante', async () => {
      const remainingAddress = {
        ...mockAddress,
        id: 'addr-uuid-2',
        esPredeterminada: false,
      };

      (repository.findOne as jest.Mock)
        .mockResolvedValueOnce({ ...mockAddress }) // findOne para buscar el que se va a borrar
        .mockResolvedValueOnce({ ...remainingAddress }); // findOne para buscar el restante

      (repository.remove as jest.Mock).mockResolvedValue(mockAddress);
      (repository.save as jest.Mock).mockImplementation((a: Address) =>
        Promise.resolve(a),
      );

      const result = await service.remove(userId, mockAddress.id);

      expect(repository.remove).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'addr-uuid-2', esPredeterminada: true }),
      );
      expect(result.message).toContain('eliminado exitosamente');
    });
  });
});
