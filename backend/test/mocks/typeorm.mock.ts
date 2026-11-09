import { Inject, Type } from '@nestjs/common';

export function getRepositoryToken(entity: Type<unknown> | string): string {
  if (typeof entity === 'string') {
    return entity;
  }
  return `${entity.name}Repository`;
}

export function InjectRepository(entity: Type<unknown> | string) {
  return Inject(getRepositoryToken(entity));
}

export class TypeOrmModule {
  static forRoot() {
    return { module: TypeOrmModule };
  }
  static forRootAsync() {
    return { module: TypeOrmModule };
  }
  static forFeature() {
    return { module: TypeOrmModule };
  }
}
