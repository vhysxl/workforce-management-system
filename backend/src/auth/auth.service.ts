import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import * as argon2 from 'argon2';
import type { StringValue } from 'ms';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';

import { ERROR_MESSAGES } from '../common/constants/error-messages.constant.js';
import { EmployeesService } from '../employees/employees.service.js';
import {
  ActivationToken,
  ActivationTokenPurpose,
} from '../employees/entities/activation-token.entities.js';
import { Employee } from '../employees/entities/employee.entity.js';
import {
  ActivateAccountDto,
  LoginDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private readonly employeesService: EmployeesService,

    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private signAccessToken(employee: Employee): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: employee.id,
        role: employee.role,
        email: employee.email,
        name: employee.full_name,
        type: 'access',
      },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<StringValue>('JWT_EXP') ?? '30m',
      },
    );
  }

  private signRefreshToken(employee: Employee): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: employee.id,
        type: 'refresh',
      },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<StringValue>('JWT_REFRESH_EXP') ?? '7d',
      },
    );
  }

  private async generateTokenPair(employee: Employee): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshExpiredAt: Date;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(employee),
      this.signRefreshToken(employee),
    ]);

    const { exp } = this.jwt.decode<{ exp: number }>(refreshToken);

    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.employeeRepository.update(
      { id: employee.id },
      {
        refresh_token_hash: hashedRefreshToken,
      },
    );

    return {
      accessToken,
      refreshToken,
      refreshExpiredAt: new Date(exp * 1000),
    };
  }

  async activateAccount(dto: ActivateAccountDto): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    return this.employeeRepository.manager.transaction(async (manager) => {
      const token = await manager.findOne(ActivationToken, {
        where: { token_hash: tokenHash },
        lock: { mode: 'pessimistic_write' },
      });

      this.validateToken(
        token,
        ActivationTokenPurpose.ACTIVATION_ACCOUNT,
        ERROR_MESSAGES.AUTH.INVALID_ACTIVATION_TOKEN,
        new Date(),
      );

      const employee = await manager.findOne(Employee, {
        where: { id: token.employee_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!employee) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }

      if (employee.deactivated_at) {
        throw new ForbiddenException(ERROR_MESSAGES.EMPLOYEE.DEACTIVATED);
      }

      if (employee.activated_at) {
        throw new ConflictException(
          ERROR_MESSAGES.AUTH.ACCOUNT_ALREADY_ACTIVATED,
        );
      }

      const passwordHash = await argon2.hash(dto.password);
      const now = new Date();

      await manager.update(
        Employee,
        { id: employee.id },
        { password_hash: passwordHash, activated_at: now },
      );
      await manager.update(ActivationToken, { id: token.id }, { used_at: now });

      return { message: 'Account activated successfully' };
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    return this.employeeRepository.manager.transaction(async (manager) => {
      const token = await manager.findOne(ActivationToken, {
        where: { token_hash: tokenHash },
        lock: { mode: 'pessimistic_write' },
      });

      this.validateToken(
        token,
        ActivationTokenPurpose.RESET_PASSWORD,
        ERROR_MESSAGES.AUTH.INVALID_RESET_PASSWORD_TOKEN,
        new Date(),
      );

      const employee = await manager.findOne(Employee, {
        where: { id: token.employee_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!employee) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }

      if (employee.deactivated_at) {
        throw new ForbiddenException(ERROR_MESSAGES.EMPLOYEE.DEACTIVATED);
      }

      if (!employee.activated_at) {
        throw new ConflictException(ERROR_MESSAGES.EMPLOYEE.NOT_ACTIVATED);
      }

      const passwordHash = await argon2.hash(dto.password);
      const now = new Date();

      await manager.update(
        Employee,
        { id: employee.id },
        { password_hash: passwordHash, refresh_token_hash: null },
      );
      await manager.update(ActivationToken, { id: token.id }, { used_at: now });

      return { message: 'Password reset successfully' };
    });
  }

  private validateToken(
    token: ActivationToken | null,
    expectedPurpose: ActivationTokenPurpose,
    errorMessage: string,
    now: Date,
  ): asserts token is ActivationToken {
    if (!token || token.purpose !== expectedPurpose) {
      throw new UnauthorizedException(errorMessage);
    }

    if (token.used_at || token.expires_at.getTime() <= now.getTime()) {
      throw new UnauthorizedException(errorMessage);
    }
  }

  async login(dto: LoginDto) {
    const employee = await this.employeesService.findByEmailWithPassword(
      dto.email,
    );

    if (!employee) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (employee.deactivated_at) {
      throw new ForbiddenException(ERROR_MESSAGES.EMPLOYEE.DEACTIVATED);
    }

    if (!employee.activated_at) {
      throw new ConflictException(ERROR_MESSAGES.EMPLOYEE.NOT_ACTIVATED);
    }

    if (!employee.password_hash) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await argon2.verify(
      employee.password_hash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    return this.generateTokenPair(employee);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    const employee = await this.employeeRepository.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        refresh_token_hash: true,
        deactivated_at: true,
      },
    });

    if (!employee || !employee.refresh_token_hash || employee.deactivated_at) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    const isRefreshTokenValid = await argon2.verify(
      employee.refresh_token_hash,
      refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    return this.generateTokenPair(employee);
  }

  async logout(refreshToken: string) {
    const payload = await this.jwt
      .verifyAsync<{ sub: string; type: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
      })
      .catch(() => null);

    if (payload?.type === 'refresh') {
      await this.employeeRepository.update(
        { id: payload.sub },
        { refresh_token_hash: null },
      );
    }

    return { message: 'Logged out successfully' };
  }
}
