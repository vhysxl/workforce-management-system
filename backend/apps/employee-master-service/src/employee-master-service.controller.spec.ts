import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeMasterServiceController } from './employee-master-service.controller.js';
import { EmployeeMasterServiceService } from './employee-master-service.service.js';

describe('EmployeeMasterServiceController', () => {
  let employeeMasterServiceController: EmployeeMasterServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeMasterServiceController],
      providers: [EmployeeMasterServiceService],
    }).compile();

    employeeMasterServiceController = app.get<EmployeeMasterServiceController>(EmployeeMasterServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(employeeMasterServiceController.getHello()).toBe('Hello World!');
    });
  });
});
