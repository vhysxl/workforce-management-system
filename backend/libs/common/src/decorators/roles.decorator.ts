import { Reflector } from '@nestjs/core';

import { EmployeeRole } from '../enums/employee-role.enum.js';

export const Roles = Reflector.createDecorator<EmployeeRole[]>();
