import { Test, TestingModule } from '@nestjs/testing';
import { VariantesController } from './variantes.controller';
import { VariantesService } from './variantes.service';

describe('VariantesController', () => {
  let controller: VariantesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariantesController],
      providers: [VariantesService],
    }).compile();

    controller = module.get<VariantesController>(VariantesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
