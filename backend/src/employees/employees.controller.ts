import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeesService } from './employees.service.js';

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
  issueActivationToken(
    @Param('employee_id', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.employeesService.issueActivationToken(employeeId);
  }

  @Post(':employee_id/reset-password-token')
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
