import { Reflector } from '@nestjs/core';

import type { EmployeeRole } from '@app/common';

export const Roles = Reflector.createDecorator<EmployeeRole[]>();
