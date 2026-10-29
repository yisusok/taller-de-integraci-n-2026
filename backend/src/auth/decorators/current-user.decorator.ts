import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class UserFromToken {
  id!: string;
  email!: string;
  rol!: string;
}

/**
 * Decorador de parámetro que extrae el usuario inyectado por el JwtAuthGuard en la solicitud.
 * Uso: @CurrentUser() user: UserFromToken
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserFromToken => {
    const request = ctx.switchToHttp().getRequest<{ user: UserFromToken }>();
    return request.user;
  },
);
