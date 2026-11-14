import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('login') async login(@Body() loginAuthDto: LoginDto) {
  //   return this.authSerlogin(logineAuthDto);
  // }
}
