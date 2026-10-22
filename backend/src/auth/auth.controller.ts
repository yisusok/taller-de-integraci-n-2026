import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService, UserWithoutPassword } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller(['auth', 'api/auth'])
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<UserWithoutPassword> {
    return this.authService.registrar(registerDto);
  }

  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  async registro(
    @Body() registerDto: RegisterDto,
  ): Promise<UserWithoutPassword> {
    return this.authService.registrar(registerDto);
  }
}
