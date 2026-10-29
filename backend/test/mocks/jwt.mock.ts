import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtService {
  sign(payload: string | Buffer | object, _options?: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = 'mock_signature';
    return `${header}.${body}.${signature}`;
  }

  verify<T extends object = any>(token: string, _options?: Record<string, unknown>): T {
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Invalid token');
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as T;
  }

  decode(token: string) {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  }
}

export class JwtModule {
  static register(_options?: Record<string, unknown>) {
    return {
      module: JwtModule,
      providers: [JwtService],
      exports: [JwtService],
    };
  }

  static registerAsync(_options?: Record<string, unknown>) {
    return {
      module: JwtModule,
      providers: [JwtService],
      exports: [JwtService],
    };
  }
}

