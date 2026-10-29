import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Decorador que restringe el acceso a los roles indicados.
 * Uso: @Roles(RolUsuario.ADMINISTRADOR)
 */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);

