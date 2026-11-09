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
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

/**
 * Rutas de Backoffice / Gestión de Stock protegidas con RBAC:
 * - Operaciones restringidas exclusivamente al rol: administrador
 * - Usuarios con rol 'cliente' o 'visitante' (y anónimos) tienen el acceso bloqueado (HTTP 403 Forbidden).
 */
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * Endpoint para registrar un movimiento de stock.
   * Restringido exclusivamente al 'administrador'.
   */
  @Post('movimientos')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RolUsuario.ADMINISTRADOR)
  async createMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
  ): Promise<StockMovement> {
    return this.stockService.recordMovement(createStockMovementDto);
  }

  /**
   * Obtiene el resumen y existencias actuales de una variante.
   * Restringido a 'administrador'.
   */
  @Get('variantes/:varianteId')
  @Roles(RolUsuario.ADMINISTRADOR)
  async getStockSummary(
    @Param('varianteId', new ParseUUIDPipe({ version: '4' }))
    varianteId: string,
  ): Promise<StockSummary> {
    return this.stockService.getStockSummary(varianteId);
  }

  /**
   * Obtiene el historial de auditoría de movimientos para una variante.
   * Restringido a 'administrador'.
   */
  @Get('variantes/:varianteId/movimientos')
  @Roles(RolUsuario.ADMINISTRADOR)
  async getVariantMovements(
    @Param('varianteId', new ParseUUIDPipe({ version: '4' }))
    varianteId: string,
  ): Promise<StockMovement[]> {
    return this.stockService.getMovementsByVariant(varianteId);
  }

  /**
   * Lista los movimientos de stock más recientes del sistema.
   * Restringido a 'administrador'.
   */
  @Get('movimientos')
  @Roles(RolUsuario.ADMINISTRADOR)
  async listMovements(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ): Promise<StockMovement[]> {
    return this.stockService.findAllMovements(limit ?? 50, offset ?? 0);
  }
}
