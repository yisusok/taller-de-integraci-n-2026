import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, RolUsuario } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { SyncOauthDto } from './dto/sync-oauth.dto';

describe('AuthService', () => {
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
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    const dto: RegisterDto = {
      nombre: '  Juan Perez  ',
      email: '  JUAN.PEREZ@EXAMPLE.COM  ',
      password: 'Password123!',
      rol: RolUsuario.CLIENTE,
    };

    it('registra un usuario exitosamente con contraseña hasheada', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockImplementation(
        (data: DeepPartial<User>) =>
          ({ id: 'uuid-1234', ...data, createdAt: new Date(), updatedAt: new Date() }) as User,
      );
      (repository.save as jest.Mock).mockImplementation((user: User) =>
        Promise.resolve(user),
      );

      const result = await service.register(dto);

      // Verifica que se busca con el email del DTO (ya transformado por el DTO validator)
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      const createCalls = (repository.create as jest.Mock).mock
        .calls as unknown as [DeepPartial<User>][];
      const createArg = createCalls[0][0];

      expect(createArg.authProvider).toBe('local');

      // La contraseña guardada debe estar cifrada con bcrypt
      const isHashValid = await bcrypt.compare('Password123!', createArg.password_hash as string);
      expect(isHashValid).toBe(true);

      // password_hash no debe exponerse en la respuesta
      const resultObj = result as unknown as Record<string, unknown>;
      expect(resultObj.password_hash).toBeUndefined();
    });

    it('lanza ConflictException si el email ya existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue({ id: 'existing', email: 'juan.perez@example.com' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si la BD devuelve error 23505 (unique constraint)', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockImplementation((data: DeepPartial<User>) => data as User);
      (repository.save as jest.Mock).mockRejectedValue({ code: '23505' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail()', () => {
    it('busca un usuario por email normalizado', async () => {
      const mockUser = { id: 'uuid-1', email: 'atleta@gym.com', authProvider: 'auth0' } as User;
      (repository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const found = await service.findByEmail('  ATLETA@GYM.COM  ');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'atleta@gym.com' } });
      expect(found).toEqual(mockUser);
    });
  });

  describe('syncOauth()', () => {
    const dto: SyncOauthDto = {
      email: '  Usuario.Google@example.com  ',
      nombre: 'Google User',
      avatar: 'https://lh3.googleusercontent.com/a/photo123',
      providerId: 'google-oauth2|123456789',
    };

    it('crea y sincroniza un nuevo usuario con cuenta de Google (nombre, avatar e email)', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockImplementation((data: DeepPartial<User>) => ({
        id: 'uuid-google-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }) as User);
      (repository.save as jest.Mock).mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.syncOauth(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'usuario.google@example.com' },
      });

      expect(repository.create).toHaveBeenCalledWith({
        email: 'usuario.google@example.com',
        nombre: 'Google User',
        avatar: 'https://lh3.googleusercontent.com/a/photo123',
        password_hash: null,
        rol: RolUsuario.CLIENTE,
        authProvider: 'google',
        providerId: 'google-oauth2|123456789',
      });

      expect(repository.save).toHaveBeenCalled();
      expect(result.id).toBe('uuid-google-1');
      expect(result.email).toBe('usuario.google@example.com');
      expect(result.nombre).toBe('Google User');
      expect(result.avatar).toBe('https://lh3.googleusercontent.com/a/photo123');
      expect((result as unknown as Record<string, unknown>).password_hash).toBeUndefined();
    });

    it('actualiza nombre y avatar sin alterar el email persistido si el usuario ya existe', async () => {
      const existingUser: User = {
        id: 'uuid-existing-1',
        email: 'usuario.google@example.com',
        nombre: 'Nombre Anterior',
        avatar: 'https://old-avatar.com/old.png',
        password_hash: 'hash-anterior',
        rol: RolUsuario.CLIENTE,
        authProvider: 'local',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (repository.findOne as jest.Mock).mockResolvedValue({ ...existingUser });
      (repository.save as jest.Mock).mockImplementation((u: User) => Promise.resolve(u));

      const updateDto: SyncOauthDto = {
        email: 'usuario.google@example.com',
        nombre: 'Nombre Actualizado Desde Google',
        avatar: 'https://new-avatar.com/new.png',
        providerId: 'google-oauth2|999999',
      };

      const result = await service.syncOauth(updateDto);

      // Verifica que no se llamó a create()
      expect(repository.create).not.toHaveBeenCalled();

      // Verifica que el save se llamó con los campos actualizados pero con el email inalterado
      const savedUser = (repository.save as jest.Mock).mock.calls[0][0] as User;
      expect(savedUser.email).toBe('usuario.google@example.com');
      expect(savedUser.nombre).toBe('Nombre Actualizado Desde Google');
      expect(savedUser.avatar).toBe('https://new-avatar.com/new.png');
      expect(savedUser.providerId).toBe('google-oauth2|999999');

      expect(result.nombre).toBe('Nombre Actualizado Desde Google');
      expect(result.avatar).toBe('https://new-avatar.com/new.png');
      expect((result as unknown as Record<string, unknown>).password_hash).toBeUndefined();
    });

    it('lanza InternalServerErrorException si la persistencia falla', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockReturnValue({} as User);
      (repository.save as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.syncOauth(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
