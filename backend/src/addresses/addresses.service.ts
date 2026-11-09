import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

export const MAX_ADDRESSES_PER_USER = 3;

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  /**
   * Registra un nuevo domicilio de envío para el cliente.
   * Límite estricto: máximo 3 domicilios.
   */
  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    const currentCount = await this.addressRepository.count({
      where: { userId },
    });

    if (currentCount >= MAX_ADDRESSES_PER_USER) {
      throw new BadRequestException(
        `Límite alcanzado: solo puedes registrar hasta ${MAX_ADDRESSES_PER_USER} domicilios de envío en tu libreta.`,
      );
    }

    // Si es la primera dirección o se solicitó como predeterminada, debe ser la predeterminada
    const shouldBeDefault = currentCount === 0 || !!dto.esPredeterminada;

    if (shouldBeDefault && currentCount > 0) {
      await this.addressRepository.update(
        { userId },
        { esPredeterminada: false },
      );
    }

    const newAddress = this.addressRepository.create({
      ...dto,
      userId,
      esPredeterminada: shouldBeDefault,
    });

    return this.addressRepository.save(newAddress);
  }

  /**
   * Obtiene todos los domicilios registrados por el cliente autenticado.
   */
  async findAll(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: {
        esPredeterminada: 'DESC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Obtiene un domicilio específico asegurando pertenencia al usuario.
   */
  async findOne(userId: string, id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException(
        'El domicilio solicitado no existe o no te pertenece.',
      );
    }

    return address;
  }

  /**
   * Actualiza los datos de un domicilio de envío existente.
   */
  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(userId, id);

    if (dto.esPredeterminada === true) {
      await this.addressRepository.update(
        { userId },
        { esPredeterminada: false },
      );
      address.esPredeterminada = true;
    } else if (dto.esPredeterminada === false && address.esPredeterminada) {
      // Si intenta desmarcar la única predeterminada, no permitimos dejar la cuenta sin predeterminada si hay otras
      const total = await this.addressRepository.count({ where: { userId } });
      if (total === 1) {
        address.esPredeterminada = true;
      } else {
        address.esPredeterminada = false;
      }
    }

    if (dto.alias !== undefined) address.alias = dto.alias;
    if (dto.calle !== undefined) address.calle = dto.calle;
    if (dto.numero !== undefined) address.numero = dto.numero;
    if (dto.pisoDepto !== undefined) address.pisoDepto = dto.pisoDepto;
    if (dto.ciudad !== undefined) address.ciudad = dto.ciudad;
    if (dto.provincia !== undefined) address.provincia = dto.provincia;
    if (dto.codigoPostal !== undefined) address.codigoPostal = dto.codigoPostal;

    return this.addressRepository.save(address);
  }

  /**
   * Establece un domicilio como el predeterminado para envíos.
   */
  async setDefault(userId: string, id: string): Promise<Address> {
    const address = await this.findOne(userId, id);

    await this.addressRepository.update(
      { userId },
      { esPredeterminada: false },
    );

    address.esPredeterminada = true;
    return this.addressRepository.save(address);
  }

  /**
   * Elimina un domicilio de envío.
   * Si era el predeterminado y quedan otros domicilios, el siguiente pasa a ser el predeterminado.
   */
  async remove(userId: string, id: string): Promise<{ message: string }> {
    const address = await this.findOne(userId, id);
    const wasDefault = address.esPredeterminada;

    await this.addressRepository.remove(address);

    if (wasDefault) {
      const remaining = await this.addressRepository.findOne({
        where: { userId },
        order: { createdAt: 'ASC' },
      });

      if (remaining) {
        remaining.esPredeterminada = true;
        await this.addressRepository.save(remaining);
      }
    }

    return { message: 'Domicilio eliminado exitosamente de tu libreta.' };
  }
}
