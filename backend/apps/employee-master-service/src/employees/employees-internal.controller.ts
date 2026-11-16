import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';

import { EmployeesService } from './employees.service.js';

@Controller('employees/internal')
export class EmployeesInternalController {
  constructor(private readonly employeesService: EmployeesService) {}

  @HttpCode(HttpStatus.OK)
  @Patch(':id/activate')
  activateAccount(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.employeesService.activateAccount(id);
  }
}
