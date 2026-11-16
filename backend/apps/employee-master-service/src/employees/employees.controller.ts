import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import { EmployeeRole, JwtGuard, Roles, RolesGuard } from '@app/common';
import { EmployeesService } from './employees.service.js';

@Controller('employees')
@UseGuards(JwtGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD])
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD, EmployeeRole.EMPLOYEE])
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }
}
