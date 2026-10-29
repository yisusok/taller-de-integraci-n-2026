import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}

/**
 * Estrategia Passport que valida tokens JWT del header Authorization: Bearer <token>.
 * Inyecta el payload decodificado en req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret =
      configService.get<string>('JWT_SECRET') ||
      'jwt_super_secret_development_key_2026';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Passport invoca este método tras verificar la firma y expiración del token.
   * El objeto retornado se inyecta como req.user en el request.
   */
  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Token JWT inválido');
    }

    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}

