import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeesService } from './employees.service.js';
import { EmployeeRole } from './entities/employee.entity.js';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // @Post()
  // create(@Body() createEmployeeDto: CreateEmployeeDto) {
  //   return this.employeesService.create(createEmployeeDto);
  // }

  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post(':employee_id/activation-token')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD])
  issueActivationToken(
    @Param('employee_id', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.employeesService.issueActivationToken(employeeId);
  }

  @Post(':employee_id/reset-password-token')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD])
  issueResetPasswordToken(
    @Param('employee_id', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.employeesService.issueResetPasswordToken(employeeId);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
  //   return this.employeesService.update(+id, updateEmployeeDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.employeesService.remove(+id);
  // }
}
