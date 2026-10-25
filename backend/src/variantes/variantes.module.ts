import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantesService } from './variantes.service';
import { VariantesController } from './variantes.controller';
import { Variante } from './entities/variante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Variante])],
  controllers: [VariantesController],
  providers: [VariantesService],
})
export class VariantesModule {}
