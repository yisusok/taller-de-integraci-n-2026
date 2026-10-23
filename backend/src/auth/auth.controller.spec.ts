import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService, PublicUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';
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
    expect((result as unknown as Record<string, unknown>).password_hash).toBeUndefined();
  });
});
