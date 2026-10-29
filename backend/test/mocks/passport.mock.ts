import { CanActivate, ExecutionContext, Type } from '@nestjs/common';

export function AuthGuard(_type?: string | string[]): Type<CanActivate> {
  return class MockAuthGuard implements CanActivate {
    canActivate(_context: ExecutionContext): boolean {
      return true;
    }
  };
}

export function PassportStrategy<T extends Type<any>>(Strategy: T, _name?: string): T {
  return Strategy;
}

export class PassportModule {
  static register(_options?: Record<string, unknown>) {
    return {
      module: PassportModule,
    };
  }
}

