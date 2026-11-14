import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import * as argon2 from 'argon2';
import type { StringValue } from 'ms';
import { Repository } from 'typeorm';

import { ERROR_MESSAGES } from '../common/constants/error-messages.constant.js';
import { EmployeesService } from '../employees/employees.service.js';
import { Employee } from '../employees/entities/employee.entity.js';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto.js';

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

  private async generateTokenPair(employee: Employee) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(employee),
      this.signRefreshToken(employee),
    ]);

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
    };
  }

  async login(dto: LoginDto) {
    const employee = await this.employeesService.findByEmailWithPassword(
      dto.email,
    );

    if (!employee) {
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

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwt.verifyAsync(dto.refreshToken, {
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
      dto.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    return this.generateTokenPair(employee);
  }

  async logout(dto: RefreshTokenDto) {
    const payload = this.jwt.decode(dto.refreshToken) as {
      sub?: string;
    } | null;

    if (payload?.sub) {
      await this.employeeRepository.update(
        { id: payload.sub },
        {
          refresh_token_hash: null,
        },
      );
    }

    return { message: 'Logged out successfully' };
  }
}
