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
import { SyncOauthDto } from './dto/sync-oauth.dto';

export type PublicUser = Omit<User, 'password_hash'>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async register(dto: RegisterDto): Promise<PublicUser> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      password_hash: passwordHash,
      rol: dto.rol ?? RolUsuario.CLIENTE,
      authProvider: 'local',
    });

    try {
      const saved = await this.userRepository.save(user);
      const { password_hash: _, ...publicUser } = saved;
      return publicUser as PublicUser;
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError?.code === '23505') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw new InternalServerErrorException('Error al registrar el usuario');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }
  async syncOauth(dto: SyncOauthDto): Promise<PublicUser> {
    const emailLimpio = dto.email.trim().toLowerCase();

    // 1. Buscamos si ya existe por email
    let user = await this.userRepository.findOne({
      where: { email: emailLimpio },
    });

    if (!user) {
      user = this.userRepository.create({
        email: emailLimpio,
        nombre: dto.nombre,
        avatar: dto.avatar ?? null,
        password_hash: null,
        rol: RolUsuario.CLIENTE,
        authProvider: 'google',
        providerId: dto.providerId ?? null,
      });
    } else {
      user.nombre = dto.nombre;
      if (dto.avatar) {
        user.avatar = dto.avatar;
      }
      if (dto.providerId) {
        user.providerId = dto.providerId;
      }
    }

    const saved = await this.userRepository.save(user);
    const { password_hash: _, ...publicUser } = saved;
    return publicUser as PublicUser;
  }

}
