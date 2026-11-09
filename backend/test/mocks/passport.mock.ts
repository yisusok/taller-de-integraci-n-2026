import { CanActivate, Type } from '@nestjs/common';

export function AuthGuard(): Type<CanActivate> {
  return class MockAuthGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  };
}

export function PassportStrategy<T extends Type<unknown>>(Strategy: T): T {
  return Strategy;
}

export class PassportModule {
  static register() {
    return {
      module: PassportModule,
    };
  }
}
