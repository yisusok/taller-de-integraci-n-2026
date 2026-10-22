import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, RolUsuario } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

export type UserWithoutPassword = Omit<User, 'password_hash'>;

interface DatabaseError {
  code?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async registrar(dto: RegisterDto): Promise<UserWithoutPassword> {
    const emailSanitizado = dto.email.trim().toLowerCase();
    const nombreSanitizado = dto.nombre.trim();

    const usuarioExistente = await this.userRepository.findOne({
      where: { email: emailSanitizado },
    });

    if (usuarioExistente) {
      throw new ConflictException(
        'El correo electrónico ya se encuentra registrado',
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const nuevoUsuario = this.userRepository.create({
      nombre: nombreSanitizado,
      email: emailSanitizado,
      password_hash: passwordHash,
      rol: dto.rol ?? RolUsuario.CLIENTE,
      authProvider: 'local',
    });

    try {
      const guardado = await this.userRepository.save(nuevoUsuario);

      const usuarioSinPassword: Partial<User> = { ...guardado };
      delete usuarioSinPassword.password_hash;
      return usuarioSinPassword as UserWithoutPassword;
    } catch (error: unknown) {
      const dbError = error as DatabaseError;
      if (dbError?.code === '23505') {
        throw new ConflictException(
          'El correo electrónico ya se encuentra registrado',
        );
      }
      throw new InternalServerErrorException(
        'Error al procesar el registro de usuario',
      );
    }
  }

  async buscarPorEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }
}
