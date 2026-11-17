import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtGuard, RolesGuard } from '@app/common';

import { AuthClientService } from './auth-client.service.js';
import { EmployeesInternalController } from './employees-internal.controller.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { Employee } from './entities/employee.entity.js';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([Employee])],
  controllers: [EmployeesController, EmployeesInternalController],
  providers: [EmployeesService, AuthClientService, JwtGuard, RolesGuard],
  exports: [EmployeesService],
})
export class EmployeesModule {}
