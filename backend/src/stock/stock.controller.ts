import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseEnumPipe,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StockService, StockSummary } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ManualExtractionDto } from './dto/manual-extraction.dto';
import { StockMovement } from './entities/stock-movement.entity';
import { TipoMovimiento } from './enums/tipo-movimiento.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  UserFromToken,
} from '../auth/decorators/current-user.decorator';
import { RolUsuario } from '../users/entities/user.entity';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) { }

  @Post('movimientos')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolUsuario.ADMINISTRADOR)
  async createMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @CurrentUser() user: UserFromToken,
  ): Promise<StockMovement> {
    return this.stockService.recordMovement({
      ...createStockMovementDto,
      usuario_id: user.id,
    });
  }

  @Post('extracciones-manuales')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolUsuario.ADMINISTRADOR)
  async createManualExtraction(
    @Body() manualExtractionDto: ManualExtractionDto,
    @CurrentUser() user: UserFromToken,
  ): Promise<StockMovement> {
    return this.stockService.recordManualExtraction(
      manualExtractionDto,
      user.id,
    );
  }

  @Get('variantes/:varianteId')
  @Roles(RolUsuario.ADMINISTRADOR)
  async getStockSummary(
    @Param('varianteId', new ParseUUIDPipe({ version: '4' }))
    varianteId: string,
  ): Promise<StockSummary> {
    return this.stockService.getStockSummary(varianteId);
  }
  @Get('variantes/:varianteId/movimientos')
  @Roles(RolUsuario.ADMINISTRADOR)
  async getVariantMovements(
    @Param('varianteId', new ParseUUIDPipe({ version: '4' }))
    varianteId: string,
  ): Promise<StockMovement[]> {
    return this.stockService.findAllMovements({
      variante_id: varianteId,
      limit: 200,
    });
  }
  @Get('movimientos')
  @Roles(RolUsuario.ADMINISTRADOR)
  async listMovements(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query(
      'tipo_movimiento',
      new ParseEnumPipe(TipoMovimiento, { optional: true }),
    )
    tipoMovimiento?: TipoMovimiento,
    @Query('variante_id', new ParseUUIDPipe({ version: '4', optional: true }))
    varianteId?: string,
  ): Promise<StockMovement[]> {
    return this.stockService.findAllMovements({
      limit,
      offset,
      tipo_movimiento: tipoMovimiento,
      variante_id: varianteId,
    });
  }
}
