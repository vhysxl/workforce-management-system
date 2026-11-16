import { Module } from '@nestjs/common';
import { EmployeeMasterServiceController } from './employee-master-service.controller.js';
import { EmployeeMasterServiceService } from './employee-master-service.service.js';

@Module({
  imports: [],
  controllers: [EmployeeMasterServiceController],
  providers: [EmployeeMasterServiceService],
})
export class EmployeeMasterServiceModule {}
