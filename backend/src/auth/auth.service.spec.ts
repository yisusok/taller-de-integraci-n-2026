import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, RolUsuario } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

describe('AuthService (AUTH-01 & AUTH-02)', () => {
  let service: AuthService;
  let repository: jest.Mocked<Partial<Repository<User>>>;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('registrar (Registro Local)', () => {
    const validDto: RegisterDto = {
      nombre: '  Juan Perez  ',
      email: '  JUAN.PEREZ@EXAMPLE.COM  ',
      password: 'Password123!',
      rol: RolUsuario.CLIENTE,
      correo_electronico: 'juan.perez@example.com',
      contrasena: 'Password123!',
    };

    it('debe registrar un usuario exitosamente con contrasena hasheada y datos saneados', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockImplementation(
        (data: DeepPartial<User>) =>
          ({
            id: 'uuid-1234',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }) as User,
      );
      (repository.save as jest.Mock).mockImplementation((user: User) =>
        Promise.resolve(user),
      );

      const result = await service.registrar(validDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'juan.perez@example.com' },
      });
      expect(repository.create).toHaveBeenCalled();
      const createCalls = (repository.create as jest.Mock).mock
        .calls as unknown as [DeepPartial<User>][];
      const createArg = createCalls[0][0];
      expect(createArg.nombre).toBe('Juan Perez');
      expect(createArg.email).toBe('juan.perez@example.com');
      expect(createArg.authProvider).toBe('local');

      // Validar que la contrasena guardada este cifrada con bcrypt y sea verificable
      const isHashValid = await bcrypt.compare(
        'Password123!',
        createArg.password_hash as string,
      );
      expect(isHashValid).toBe(true);

      // Validar que password_hash nunca se expone en la respuesta al cliente
      const resultObj = result as unknown as Record<string, unknown>;
      expect(resultObj.password_hash).toBeUndefined();
      expect(result.email).toBe('juan.perez@example.com');
      expect(result.nombre).toBe('Juan Perez');
    });

    it('debe lanzar ConflictException (409) con mensaje explicito si el email ya existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue({
        id: 'uuid-existente',
        email: 'juan.perez@example.com',
      });

      await expect(service.registrar(validDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.registrar(validDto)).rejects.toThrow(
        'El correo electrónico ya se encuentra registrado',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('debe capturar error de restriccion unica en base de datos (23505) y lanzar ConflictException', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockImplementation(
        (data: DeepPartial<User>) => data as User,
      );
      (repository.save as jest.Mock).mockRejectedValue({ code: '23505' });

      await expect(service.registrar(validDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('buscarPorEmail (Preparacion para Google / Auth0)', () => {
    it('debe buscar un usuario por email normalizado', async () => {
      const mockUser = {
        id: 'uuid-google',
        email: 'atleta@gym.com',
        nombre: 'Atleta',
        authProvider: 'google',
      } as User;
      (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const found = await service.buscarPorEmail('  ATLETA@GYM.COM  ');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'atleta@gym.com' },
      });
      expect(found).toEqual(mockUser);
    });
  });
});
