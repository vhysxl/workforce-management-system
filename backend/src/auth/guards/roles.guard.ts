import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant.js';
import { Roles } from '../decorators/roles.decorator.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.MISSING_ACCESS_TOKEN);
    }

    if (!roles.includes(request.user.role)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.INSUFFICIENT_ROLE);
    }

    return true;
  }
}
