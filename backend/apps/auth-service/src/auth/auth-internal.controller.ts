import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { CreateCredentialDto } from './dto/auth.dto.js';

@Controller('auth/internal')
export class AuthInternalController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('credentials')
  createCredential(@Body() dto: CreateCredentialDto) {
    return this.authService.createCredential(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('credentials/:employeeId/deactivate')
  deactivateCredential(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.authService.deactivateCredential(employeeId);
  }
}
