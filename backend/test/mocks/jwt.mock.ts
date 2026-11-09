import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtService {
  sign(payload: string | Buffer | object): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = 'mock_signature';
    return `${header}.${body}.${signature}`;
  }

  verify<T extends object = Record<string, unknown>>(token: string): T {
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Invalid token');
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as T;
  }

  decode(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  }
}

export class JwtModule {
  static register() {
    return {
      module: JwtModule,
      providers: [JwtService],
      exports: [JwtService],
    };
  }

  static registerAsync() {
    return {
      module: JwtModule,
      providers: [JwtService],
      exports: [JwtService],
    };
  }
}
