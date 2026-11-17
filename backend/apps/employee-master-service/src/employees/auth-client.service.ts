import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ERROR_MESSAGES, EmployeeRole } from '@app/common';

@Injectable()
export class AuthClientService {
  private readonly logger = new Logger(AuthClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('services.auth.url') ??
      'http://localhost:3001/api';
  }

  async createCredential(dto: {
    employee_id: string;
    email: string;
    role: EmployeeRole;
  }): Promise<void> {
    let authRes: Response;
    try {
      authRes = await fetch(`${this.baseUrl}/auth/internal/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
    } catch (err) {
      this.logger.error(
        ERROR_MESSAGES.SERVICE.UNREACHABLE('Auth Service'),
        err,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.EMPLOYEE.REGISTRATION_FAILED,
      );
    }

    if (!authRes.ok) {
      if (authRes.status === 409) {
        throw new ConflictException(
          ERROR_MESSAGES.AUTH.CREDENTIAL_ALREADY_EXISTS,
        );
      }
      this.logger.error(
        ERROR_MESSAGES.SERVICE.FAILED('Auth Service', authRes.status),
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.EMPLOYEE.REGISTRATION_FAILED,
      );
    }
  }

  async updateCredential(
    employeeId: string,
    dto: { email?: string; role?: EmployeeRole },
  ): Promise<void> {
    let authRes: Response;
    try {
      authRes = await fetch(
        `${this.baseUrl}/auth/internal/credentials/${employeeId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
      );
    } catch (err) {
      this.logger.error(
        ERROR_MESSAGES.SERVICE.UNREACHABLE('Auth Service'),
        err,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.EMPLOYEE.UPDATE_FAILED,
      );
    }

    if (!authRes.ok) {
      if (authRes.status === 404) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }
      if (authRes.status === 409) {
        throw new ConflictException(
          ERROR_MESSAGES.AUTH.CREDENTIAL_ALREADY_EXISTS,
        );
      }
      this.logger.error(
        ERROR_MESSAGES.SERVICE.FAILED('Auth Service', authRes.status),
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.EMPLOYEE.UPDATE_FAILED,
      );
    }
  }

  async deactivateCredential(employeeId: string): Promise<void> {
    let authRes: Response;
    try {
      authRes = await fetch(
        `${this.baseUrl}/auth/internal/credentials/${employeeId}/deactivate`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (err) {
      this.logger.error(
        ERROR_MESSAGES.SERVICE.UNREACHABLE('Auth Service'),
        err,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.EMPLOYEE.DEACTIVATION_FAILED,
      );
    }

    if (!authRes.ok) {
      if (authRes.status === 404) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }
      this.logger.error(
        ERROR_MESSAGES.SERVICE.FAILED('Auth Service', authRes.status),
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.EMPLOYEE.DEACTIVATION_FAILED,
      );
    }
  }
}
