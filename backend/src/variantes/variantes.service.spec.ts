import { Test, TestingModule } from '@nestjs/testing';
import { VariantesService } from './variantes.service';

describe('VariantesService', () => {
  let service: VariantesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariantesService],
    }).compile();

    service = module.get<VariantesService>(VariantesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
