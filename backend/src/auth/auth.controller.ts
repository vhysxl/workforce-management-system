import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginAuthDto: LoginDto) {
    return this.authService.login(loginAuthDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }
}
