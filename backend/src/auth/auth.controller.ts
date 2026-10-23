import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService, PublicUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SyncOauthDto } from './dto/sync-oauth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }
  @Post('sync-oauth')
  @HttpCode(HttpStatus.OK)
  syncOauth(@Body() dto: SyncOauthDto): Promise<PublicUser> {
    return this.authService.syncOauth(dto);
  }

}
