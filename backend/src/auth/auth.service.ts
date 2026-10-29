import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, RolUsuario } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SyncOauthDto } from './dto/sync-oauth.dto';
import * as crypto from 'crypto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

export type PublicUser = Omit<User, 'password_hash'>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _, ...publicUser } = saved;
      return publicUser;
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError?.code === '23505') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw new InternalServerErrorException('Error al registrar el usuario');
    }
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: PublicUser; access_token: string; message: string }> {
    const emailLimpio = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: emailLimpio },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException(
        'Correo electrónico o contraseña incorrectos',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException(
        'Correo electrónico o contraseña incorrectos',
      );
    }

    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      password_hash: _pw,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      resetPasswordToken: _rpt,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      resetPasswordExpires: _rpe,
      ...publicUser
    } = user;

    const payload = { sub: user.id, email: user.email, rol: user.rol };
    const access_token = this.jwtService.sign(payload);

    return {
      user: publicUser,
      access_token,
      message: 'Inicio de sesión exitoso',
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async syncOauth(
    dto: SyncOauthDto,
  ): Promise<{ user: PublicUser; access_token: string }> {
    const emailLimpio = dto.email.trim().toLowerCase();

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

    try {
      const saved = await this.userRepository.save(user);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash: _, ...publicUser } = saved;

      const payload = { sub: saved.id, email: saved.email, rol: saved.rol };
      const access_token = this.jwtService.sign(payload);

      return { user: publicUser, access_token };
    } catch {
      throw new InternalServerErrorException(
        'Error al sincronizar el usuario OAuth',
      );
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const emailLimpio = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: emailLimpio },
    });

    if (!user) {
      return {
        message:
          'Si el correo está registrado, se enviará un enlace de recuperación.',
      };
    }

    // Token criptográfico plano para el enlace del correo
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hash SHA-256 para almacenamiento seguro en BD (estándar OWASP contra fuga de tokens en dumps)
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await this.userRepository.save(user);

    // Enviar correo real con el token plano
    const mailResult = await this.mailService.sendPasswordResetEmail(
      user.email,
      rawToken,
    );

    return {
      message:
        'Si el correo está registrado, se enviará un enlace de recuperación.',
      ...(process.env.NODE_ENV !== 'production' &&
        mailResult.previewUrl && { previewUrl: mailResult.previewUrl }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Hashear el token recibido antes de buscar en la BD
    const incomingTokenHash = crypto
      .createHash('sha256')
      .update(dto.token.trim())
      .digest('hex');

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: incomingTokenHash },
    });

    if (!user || !user.resetPasswordExpires) {
      throw new BadRequestException(
        'El token de recuperación es inválido o no existe.',
      );
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException(
        'El token de recuperación ha expirado. Solicita uno nuevo.',
      );
    }

    user.password_hash = await bcrypt.hash(dto.newPassword, 10);

    // Destrucción inmediata del token (single-use)
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    return {
      message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.',
    };
  }
}
