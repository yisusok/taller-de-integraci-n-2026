import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import {
  CurrentUser,
  UserFromToken,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../users/entities/user.entity';

/**
 * Controlador de Libreta de Direcciones de Envío:
 * - CRUD de domicilios para clientes autenticados.
 * - Límite estricto de hasta 3 domicilios por cliente.
 * - Soporte para dirección predeterminada.
 */
@Controller('addresses')
@Roles(RolUsuario.CLIENTE, RolUsuario.ADMINISTRADOR)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: UserFromToken, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserFromToken) {
    return this.addressesService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: UserFromToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.addressesService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserFromToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id, id, dto);
  }

  @Patch(':id/default')
  setDefault(
    @CurrentUser() user: UserFromToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.addressesService.setDefault(user.id, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: UserFromToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.addressesService.remove(user.id, id);
  }
}
