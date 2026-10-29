import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StockService, StockSummary } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovement } from './entities/stock-movement.entity';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * Endpoint para registrar un movimiento de stock (única forma de alterar existencias).
   * No se proveen endpoints PUT ni DELETE, asegurando la inmutabilidad de los datos.
   */
  @Post('movimientos')
  @HttpCode(HttpStatus.CREATED)
  async createMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
  ): Promise<StockMovement> {
    return this.stockService.recordMovement(createStockMovementDto);
  }

  /**
   * Obtiene el resumen y existencias actuales de una variante calculadas desde el libro mayor.
   */
  @Get('variantes/:varianteId')
  async getStockSummary(
    @Param('varianteId', new ParseUUIDPipe({ version: '4' }))
    varianteId: string,
  ): Promise<StockSummary> {
    return this.stockService.getStockSummary(varianteId);
  }

  /**
   * Obtiene el historial de auditoría de movimientos para una variante específica.
   */
  @Get('variantes/:varianteId/movimientos')
  async getVariantMovements(
    @Param('varianteId', new ParseUUIDPipe({ version: '4' }))
    varianteId: string,
  ): Promise<StockMovement[]> {
    return this.stockService.getMovementsByVariant(varianteId);
  }

  /**
   * Lista los movimientos de stock más recientes del sistema.
   */
  @Get('movimientos')
  async listMovements(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ): Promise<StockMovement[]> {
    return this.stockService.findAllMovements(limit ?? 50, offset ?? 0);
  }
}
