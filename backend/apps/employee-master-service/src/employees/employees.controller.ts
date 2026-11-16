import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  EmployeeRole,
  JwtGuard,
  Roles,
  RolesGuard,
} from '@app/common';
import type { AuthenticatedRequest } from '@app/common';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeesService } from './employees.service.js';

@Controller('employees')
@UseGuards(JwtGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD])
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD])
  findAll(@Query() query: PaginationQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get('me')
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD, EmployeeRole.EMPLOYEE])
  findMe(@Req() request: AuthenticatedRequest) {
    return this.employeesService.findOne(
      request.user.sub,
      request.user.role,
      request.user.sub,
    );
  }

  @Get(':id')
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD, EmployeeRole.EMPLOYEE])
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.employeesService.findOne(id, request.user.role, request.user.sub);
  }

  @Put(':id')
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD])
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.employeesService.update(
      id,
      updateEmployeeDto,
      request.user.role,
    );
  }

  @Patch(':id/deactivate')
  @Roles([EmployeeRole.ADMIN, EmployeeRole.HRD])
  deactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.employeesService.deactivate(
      id,
      request.user.role,
      request.user.sub,
    );
  }
}
