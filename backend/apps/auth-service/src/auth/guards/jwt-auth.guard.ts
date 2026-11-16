import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { Request } from 'express';

import { EmployeeRole, ERROR_MESSAGES } from '@app/common';

export interface AccessTokenPayload {
  sub: string;
  role: EmployeeRole;
  email: string;
  name?: string;
  type: 'access';
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tokenJwt = this.extractTokenFromHeader(request);

    if (!tokenJwt) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.MISSING_ACCESS_TOKEN);
    }

    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        tokenJwt,
        {
          secret,
          algorithms: ['HS256'],
        },
      );
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_ACCESS_TOKEN);
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_ACCESS_TOKEN);
    }

    request.user = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token, extra] =
      request.headers.authorization?.trim().split(/\s+/) ?? [];
    return type?.toLowerCase() === 'bearer' && !extra ? token : undefined;
  }
}
