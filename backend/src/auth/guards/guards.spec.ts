import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolUsuario } from '../../users/entities/user.entity';

describe('Guards de Control de Acceso y Middleware (AUTH-5)', () => {
  let reflector: Reflector;
  let rolesGuard: RolesGuard;
  let jwtAuthGuard: JwtAuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    jwtAuthGuard = new JwtAuthGuard(reflector);
  });

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('JwtAuthGuard', () => {
    it('debe permitir acceso si la ruta está marcada con @Public()', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockContext();

      const result = jwtAuthGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('debe delegar a Passport AuthGuard si la ruta no es @Public()', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = createMockContext();

      expect(() => jwtAuthGuard.canActivate(context)).not.toThrow();
    });
  });

  describe('RolesGuard (RBAC y Protección de Backoffice)', () => {
    it('debe permitir acceso si la ruta no define roles requeridos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext({ rol: RolUsuario.CLIENTE });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('debe permitir acceso a backoffice si el usuario es administrador', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RolUsuario.ADMINISTRADOR]);
      const context = createMockContext({
        id: 'u1',
        email: 'admin@ecommerce.com',
        rol: RolUsuario.ADMINISTRADOR,
      });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('debe BLOQUEAR con ForbiddenException si el usuario es cliente (no autorizado en backoffice)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RolUsuario.ADMINISTRADOR]);
      const context = createMockContext({
        id: 'u2',
        email: 'cliente@ecommerce.com',
        rol: RolUsuario.CLIENTE,
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debe BLOQUEAR con ForbiddenException si el usuario es visitante (no autorizado en backoffice)', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RolUsuario.ADMINISTRADOR]);
      const context = createMockContext({
        id: 'u3',
        email: 'visitante@ecommerce.com',
        rol: RolUsuario.VISITANTE,
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('debe BLOQUEAR con ForbiddenException si el request no tiene usuario autenticado', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([RolUsuario.ADMINISTRADOR]);
      const context = createMockContext(undefined);

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
