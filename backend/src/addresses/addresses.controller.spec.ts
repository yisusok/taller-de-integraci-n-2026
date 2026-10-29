import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UserFromToken } from '../auth/decorators/current-user.decorator';

describe('AddressesController', () => {
  let controller: AddressesController;
  let service: Partial<AddressesService>;

  const mockUser: UserFromToken = {
    id: 'user-uuid-1',
    email: 'cliente@ecommerce.com',
    rol: 'cliente',
  };

  const mockAddress: Address = {
    id: 'addr-uuid-1',
    userId: mockUser.id,
    alias: 'Casa',
    calle: 'Av. Libertador',
    numero: '1000',
    ciudad: 'CABA',
    provincia: 'CABA',
    codigoPostal: '1425',
    esPredeterminada: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockAddress),
      findAll: jest.fn().mockResolvedValue([mockAddress]),
      findOne: jest.fn().mockResolvedValue(mockAddress),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockAddress, alias: 'Casa Actualizada' }),
      setDefault: jest
        .fn()
        .mockResolvedValue({ ...mockAddress, esPredeterminada: true }),
      remove: jest
        .fn()
        .mockResolvedValue({ message: 'Domicilio eliminado exitosamente' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [{ provide: AddressesService, useValue: service }],
    }).compile();

    controller = module.get<AddressesController>(AddressesController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('POST /api/addresses → crea un nuevo domicilio para el usuario autenticado', async () => {
    const dto: CreateAddressDto = {
      alias: 'Casa',
      calle: 'Av. Libertador',
      numero: '1000',
      ciudad: 'CABA',
      provincia: 'CABA',
      codigoPostal: '1425',
    };

    const result = await controller.create(mockUser, dto);

    expect(service.create).toHaveBeenCalledWith(mockUser.id, dto);
    expect(result.id).toBe(mockAddress.id);
  });

  it('GET /api/addresses → lista los domicilios del cliente', async () => {
    const result = await controller.findAll(mockUser);

    expect(service.findAll).toHaveBeenCalledWith(mockUser.id);
    expect(result).toHaveLength(1);
  });

  it('PATCH /api/addresses/:id/default → marca un domicilio como predeterminado', async () => {
    const result = await controller.setDefault(mockUser, mockAddress.id);

    expect(service.setDefault).toHaveBeenCalledWith(
      mockUser.id,
      mockAddress.id,
    );
    expect(result.esPredeterminada).toBe(true);
  });

  it('DELETE /api/addresses/:id → elimina un domicilio de envío', async () => {
    const result = await controller.remove(mockUser, mockAddress.id);

    expect(service.remove).toHaveBeenCalledWith(mockUser.id, mockAddress.id);
    expect(result.message).toContain('eliminado exitosamente');
  });
});
