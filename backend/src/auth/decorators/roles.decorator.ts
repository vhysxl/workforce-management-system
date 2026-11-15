import { Reflector } from '@nestjs/core';

import type { EmployeeRole } from '../../employees/entities/employee.entity.js';

export const Roles = Reflector.createDecorator<EmployeeRole[]>();
