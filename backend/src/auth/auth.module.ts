import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeesModule } from '../employees/employees.module.js';
import { Employee } from '../employees/entities/employee.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Employee]),
    EmployeesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
