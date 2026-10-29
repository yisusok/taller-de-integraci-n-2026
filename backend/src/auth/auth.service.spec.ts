import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { User, RolUsuario } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { SyncOauthDto } from './dto/sync-oauth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<Partial<Repository<User>>>;
  let mailService: Partial<MailService>;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue({ previewUrl: 'https://ethereal.email/message/mock' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: MailService, useValue: mailService },
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

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      const createCalls = (repository.create as jest.Mock).mock
        .calls as unknown as [DeepPartial<User>][];
      const createArg = createCalls[0][0];

      expect(createArg.authProvider).toBe('local');

      const isHashValid = await bcrypt.compare('Password123!', createArg.password_hash as string);
      expect(isHashValid).toBe(true);

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

      expect(repository.create).not.toHaveBeenCalled();

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

  describe('forgotPassword()', () => {
    it('genera token temporal en texto plano, persiste su hash SHA-256 en BD y envía el correo', async () => {
      const mockUser: User = {
        id: 'uuid-1',
        email: 'recuperar@example.com',
        nombre: 'Carlos',
        rol: RolUsuario.CLIENTE,
        authProvider: 'local',
        password_hash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (repository.findOne as jest.Mock).mockResolvedValue({ ...mockUser });
      (repository.save as jest.Mock).mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.forgotPassword({ email: '  RECUPERAR@EXAMPLE.COM  ' });

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'recuperar@example.com' } });
      expect(repository.save).toHaveBeenCalled();

      const savedUser = (repository.save as jest.Mock).mock.calls[0][0] as User;
      expect(savedUser.resetPasswordToken).toBeDefined();
      expect(typeof savedUser.resetPasswordToken).toBe('string');
      // Hash SHA-256 en hexadecimal tiene exactamente 64 caracteres
      expect(savedUser.resetPasswordToken?.length).toBe(64);
      expect(savedUser.resetPasswordExpires).toBeInstanceOf(Date);

      // El correo debe enviarse con el token en texto plano de 64 caracteres (32 bytes hex)
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'recuperar@example.com',
        expect.stringMatching(/^[a-f0-9]{64}$/),
      );
      expect(result.message).toBe('Si el correo está registrado, se enviará un enlace de recuperación.');
    });

    it('devuelve mensaje sin error ni persistencia si el usuario no existe (evita enumeración)', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'noexiste@example.com' });

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'noexiste@example.com' } });
      expect(repository.save).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result.message).toBe('Si el correo está registrado, se enviará un enlace de recuperación.');
    });
  });

  describe('resetPassword()', () => {
    it('valida el hash SHA-256 del token, actualiza la contraseña e invalida el token temporal', async () => {
      const rawToken = 'valid-token-12345';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const existingUser: User = {
        id: 'uuid-1',
        email: 'recuperar@example.com',
        nombre: 'Carlos',
        rol: RolUsuario.CLIENTE,
        authProvider: 'local',
        password_hash: 'old-hash',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000), // expira en 10 min
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (repository.findOne as jest.Mock).mockResolvedValue({ ...existingUser });
      (repository.save as jest.Mock).mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.resetPassword({
        token: rawToken,
        newPassword: 'NewPassword123!',
      });

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { resetPasswordToken: tokenHash },
      });

      const savedUser = (repository.save as jest.Mock).mock.calls[0][0] as User;
      expect(savedUser.resetPasswordToken).toBeNull();
      expect(savedUser.resetPasswordExpires).toBeNull();
      const isNewHashValid = await bcrypt.compare('NewPassword123!', savedUser.password_hash as string);
      expect(isNewHashValid).toBe(true);

      expect(result.message).toContain('Contraseña actualizada exitosamente');
    });

    it('lanza BadRequestException si el token es inválido o no existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'token-inexistente', newPassword: 'NewPassword123!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el token ha expirado', async () => {
      const rawToken = 'expired-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const expiredUser: User = {
        id: 'uuid-1',
        email: 'recuperar@example.com',
        nombre: 'Carlos',
        rol: RolUsuario.CLIENTE,
        authProvider: 'local',
        password_hash: 'old-hash',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() - 5000), // expiró hace 5 seg
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (repository.findOne as jest.Mock).mockResolvedValue(expiredUser);

      await expect(
        service.resetPassword({ token: rawToken, newPassword: 'NewPassword123!' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
