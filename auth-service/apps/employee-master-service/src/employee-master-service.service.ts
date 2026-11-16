import { Injectable } from '@nestjs/common';

@Injectable()
export class EmployeeMasterServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
