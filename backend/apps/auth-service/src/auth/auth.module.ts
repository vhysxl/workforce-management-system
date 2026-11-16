import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthInternalController } from './auth-internal.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ActivationToken } from './entities/activation-token.entity.js';
import { EmployeeAuthCredential } from './entities/employee-auth-credential.entity.js';
import { JwtGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([EmployeeAuthCredential, ActivationToken]),
  ],
  controllers: [AuthController, AuthInternalController],
  providers: [AuthService, JwtGuard, RolesGuard],
  exports: [AuthService, JwtGuard, RolesGuard],
})
export class AuthModule {}
