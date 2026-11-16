import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

// legacy: to be removed after auth.service refactor
import { EmployeesModule } from '../employees/employees.module.js';
import { ActivationToken } from '../employees/entities/activation-token.entities.js';
import { Employee } from '../employees/entities/employee.entity.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ActivationToken as AuthActivationToken } from './entities/activation-token.entity.js';
import { EmployeeAuthCredential } from './entities/employee-auth-credential.entity.js';
import { JwtGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      // legacy
      Employee,
      ActivationToken,

      // new 
      EmployeeAuthCredential,
      AuthActivationToken,
    ]),
    EmployeesModule, // legacy
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, RolesGuard],
  exports: [JwtGuard, RolesGuard],
})
export class AuthModule {}
