import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Variante } from './entities/variante.entity';
import { Producto } from '../productos/entities/producto.entity';
import { StockModule } from '../stock/stock.module';
import { VariantesService } from './variantes.service';
import { VariantesController } from './variantes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Variante, Producto]), StockModule],
  controllers: [VariantesController],
  providers: [VariantesService],
  exports: [VariantesService, TypeOrmModule],
})
export class VariantesModule {}
