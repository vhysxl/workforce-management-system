import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { ActivationToken } from './entities/activation_token.entities.js';
import { Employee } from './entities/employee.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, ActivationToken])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
