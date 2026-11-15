import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeesModule } from '../employees/employees.module.js';
import { ActivationToken } from '../employees/entities/activation_token.entities.js';
import { Employee } from '../employees/entities/employee.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Employee, ActivationToken]),
    EmployeesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, RolesGuard],
  exports: [JwtGuard, RolesGuard],
})
export class AuthModule {}
