import { Controller, Get } from '@nestjs/common';
import { EmployeeMasterServiceService } from './employee-master-service.service.js';

@Controller()
export class EmployeeMasterServiceController {
  constructor(private readonly employeeMasterServiceService: EmployeeMasterServiceService) {}

  @Get()
  getHello(): string {
    return this.employeeMasterServiceService.getHello();
  }
}
