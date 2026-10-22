import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService, UserWithoutPassword } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RolUsuario } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;

  const mockUserResult: UserWithoutPassword = {
    id: 'uuid-1234',
    nombre: 'Carlos Gomez',
    email: 'carlos@example.com',
    rol: RolUsuario.CLIENTE,
    authProvider: 'local',
    providerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    correo_electronico: 'carlos@example.com',
    contrasena_hash: null,
  };

  beforeEach(async () => {
    authService = {
      registrar: jest.fn().mockResolvedValue(mockUserResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe registrar a un usuario mediante POST /register', async () => {
    const dto: RegisterDto = {
      nombre: 'Carlos Gomez',
      email: 'carlos@example.com',
      password: 'SuperSecret1!',
      correo_electronico: 'carlos@example.com',
      contrasena: 'SuperSecret1!',
    };

    const result = await controller.register(dto);

    expect(authService.registrar).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('uuid-1234');
    expect(result.email).toBe('carlos@example.com');
  });

  it('debe registrar a un usuario mediante POST /registro (alias)', async () => {
    const dto: RegisterDto = {
      nombre: 'Carlos Gomez',
      email: 'carlos@example.com',
      password: 'SuperSecret1!',
      correo_electronico: 'carlos@example.com',
      contrasena: 'SuperSecret1!',
    };

    const result = await controller.registro(dto);

    expect(authService.registrar).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('uuid-1234');
  });
});
