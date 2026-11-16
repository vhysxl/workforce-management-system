import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtGuard, RolesGuard } from '@app/common';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { Employee } from './entities/employee.entity.js';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([Employee]),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, JwtGuard, RolesGuard],
  exports: [EmployeesService],
})
export class EmployeesModule {}
