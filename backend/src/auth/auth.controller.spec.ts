import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthController } from './auth.controller';
import { AuthService, PublicUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SyncOauthDto } from './dto/sync-oauth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RolUsuario } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;

  const mockUser: PublicUser = {
    id: 'uuid-1234',
    nombre: 'Carlos Gomez',
    email: 'carlos@example.com',
    rol: RolUsuario.CLIENTE,
    authProvider: 'local',
    providerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue(mockUser),
      login: jest.fn().mockResolvedValue({
        user: mockUser,
        access_token: 'mock-jwt-token-xyz',
        message: 'Inicio de sesión exitoso',
      }),
      syncOauth: jest.fn().mockResolvedValue({
        user: {
          ...mockUser,
          authProvider: 'google',
          avatar: 'https://example.com/avatar.jpg',
          providerId: 'google-oauth2|123456',
        },
        access_token: 'mock-jwt-token-xyz',
      }),
      forgotPassword: jest.fn().mockResolvedValue({
        message:
          'Si el correo está registrado, se enviará un enlace de recuperación.',
      }),
      resetPassword: jest.fn().mockResolvedValue({
        message:
          'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('POST /api/auth/register → registra un usuario y devuelve PublicUser', async () => {
    const dto: RegisterDto = {
      nombre: 'Carlos Gomez',
      email: 'carlos@example.com',
      password: 'SuperSecret1!',
    };

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('uuid-1234');
    expect(result.email).toBe('carlos@example.com');
    expect(
      (result as unknown as Record<string, unknown>).password_hash,
    ).toBeUndefined();
  });

  it('POST /api/auth/login → autentica un usuario y devuelve sesión', async () => {
    const dto: LoginDto = {
      email: 'carlos@example.com',
      password: 'SuperSecret1!',
    };

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result.user.id).toBe('uuid-1234');
    expect(result.message).toBe('Inicio de sesión exitoso');
  });

  it('POST /api/auth/sync-oauth → sincroniza cuenta Google OAuth y devuelve sesión con token', async () => {
    const dto: SyncOauthDto = {
      nombre: 'Carlos Gomez',
      email: 'carlos@example.com',
      avatar: 'https://example.com/avatar.jpg',
      providerId: 'google-oauth2|123456',
    };

    const result = await controller.syncOauth(dto);

    expect(authService.syncOauth).toHaveBeenCalledWith(dto);
    expect(result.user.id).toBe('uuid-1234');
    expect(result.user.avatar).toBe('https://example.com/avatar.jpg');
    expect(result.user.authProvider).toBe('google');
    expect(result.access_token).toBe('mock-jwt-token-xyz');
  });

  it('POST /api/auth/forgot-password → emite solicitud de recuperación', async () => {
    const dto: ForgotPasswordDto = { email: 'carlos@example.com' };

    const result = await controller.forgotPassword(dto);

    expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    expect(result.message).toContain('Si el correo está registrado');
  });

  it('POST /api/auth/reset-password → redefine la contraseña con token válido', async () => {
    const dto: ResetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'NuevaContrasena123!',
    };

    const result = await controller.resetPassword(dto);

    expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    expect(result.message).toContain('Contraseña actualizada exitosamente');
  });

  it('ResetPasswordDto rechaza contraseñas que no cumplen la política de complejidad', async () => {
    const dtoSinMayuscula = plainToInstance(ResetPasswordDto, {
      token: 'token-123',
      newPassword: 'password123!',
    });
    const errorsSinMayus = await validate(dtoSinMayuscula);
    expect(errorsSinMayus.length).toBeGreaterThan(0);
    expect(errorsSinMayus[0].constraints?.matches).toBeDefined();

    const dtoSinNumero = plainToInstance(ResetPasswordDto, {
      token: 'token-123',
      newPassword: 'PasswordSinNumero',
    });
    const errorsSinNumero = await validate(dtoSinNumero);
    expect(errorsSinNumero.length).toBeGreaterThan(0);

    const dtoCorta = plainToInstance(ResetPasswordDto, {
      token: 'token-123',
      newPassword: 'P1!',
    });
    const errorsCorta = await validate(dtoCorta);
    expect(errorsCorta.length).toBeGreaterThan(0);
    expect(errorsCorta[0].constraints?.minLength).toBeDefined();
  });

  it('ResetPasswordDto acepta contraseñas fuertes que cumplen todas las reglas', async () => {
    const dtoValido = plainToInstance(ResetPasswordDto, {
      token: 'token-123',
      newPassword: 'ContrasenaSegura2026!',
    });
    const errors = await validate(dtoValido);
    expect(errors.length).toBe(0);
  });
});
