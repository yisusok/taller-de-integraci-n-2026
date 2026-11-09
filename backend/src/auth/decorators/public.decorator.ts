import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como pública, eximiéndola del JwtAuthGuard global.
 * Uso: @Public() sobre el handler o controller.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
