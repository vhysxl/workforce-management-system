import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import {
  ActivationTokenPurpose,
  ERROR_MESSAGES,
  EmployeeRole,
  canManageEmployeeRole,
} from '@app/common';
import * as argon2 from 'argon2';
import type { StringValue } from 'ms';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';

import {
  ActivateAccountDto,
  CheckTokenDto,
  CreateCredentialDto,
  IssueTokenDto,
  LoginDto,
  ResetPasswordDto,
  UpdateCredentialDto,
} from './dto/auth.dto.js';
import { ActivationToken } from './entities/activation-token.entity.js';
import { EmployeeAuthCredential } from './entities/employee-auth-credential.entity.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(EmployeeAuthCredential)
    private readonly credentialRepository: Repository<EmployeeAuthCredential>,
    @InjectRepository(ActivationToken)
    private readonly tokenRepository: Repository<ActivationToken>,

    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async activateAccount(dto: ActivateAccountDto): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    return this.credentialRepository.manager.transaction(async (manager) => {
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

      const credential = await manager.findOne(EmployeeAuthCredential, {
        where: { employee_id: token.employee_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!credential) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }

      if (credential.is_active) {
        throw new ConflictException(
          ERROR_MESSAGES.AUTH.ACCOUNT_ALREADY_ACTIVATED,
        );
      }

      const passwordHash = await argon2.hash(dto.password);
      const now = new Date();

      await manager.update(
        EmployeeAuthCredential,
        { id: credential.id },
        { password_hash: passwordHash, is_active: true },
      );
      await manager.update(ActivationToken, { id: token.id }, { used_at: now });

      // downstream to update activated_at
      const employeeServiceUrl =
        this.config.get<string>('services.employee.url') ??
        'http://localhost:3002/api';

      try {
        const notifyRes = await fetch(
          `${employeeServiceUrl}/employees/internal/${token.employee_id}/activate`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!notifyRes.ok) {
          this.logger.error(
            ERROR_MESSAGES.SERVICE.FAILED(
              'employee-master-service',
              notifyRes.status,
            ),
          );
          throw new InternalServerErrorException(
            ERROR_MESSAGES.EMPLOYEE.ACTIVATION_FAILED,
          );
        }
      } catch (err) {
        if (err instanceof InternalServerErrorException) {
          throw err;
        }
        this.logger.error(
          ERROR_MESSAGES.SERVICE.UNREACHABLE('employee-master-service'),
          err,
        );
        throw new InternalServerErrorException(
          ERROR_MESSAGES.EMPLOYEE.ACTIVATION_FAILED,
        );
      }

      return { message: 'Account activated successfully' };
    });
  }

  async checkToken(dto: CheckTokenDto): Promise<{
    is_active: boolean;
    purpose: ActivationTokenPurpose | null;
  }> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const token = await this.tokenRepository.findOne({
      where: { token_hash: tokenHash },
    });

    if (!token || token.used_at || token.expires_at.getTime() <= Date.now()) {
      return { is_active: false, purpose: token?.purpose ?? null };
    }

    const credential = await this.credentialRepository.findOne({
      where: { employee_id: token.employee_id },
    });

    if (!credential) {
      return { is_active: false, purpose: token.purpose };
    }

    if (token.purpose === ActivationTokenPurpose.ACTIVATION_ACCOUNT) {
      return { is_active: !credential.is_active, purpose: token.purpose };
    } else if (token.purpose === ActivationTokenPurpose.RESET_PASSWORD) {
      return { is_active: credential.is_active, purpose: token.purpose };
    } else {
      return { is_active: false, purpose: token.purpose };
    }
  }

  async login(dto: LoginDto) {
    const credential = await this.credentialRepository.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        employee_id: true,
        email: true,
        role: true,
        password_hash: true,
        is_active: true,
      },
    });

    if (!credential) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!credential.is_active && !credential.password_hash) {
      throw new ConflictException(ERROR_MESSAGES.EMPLOYEE.NOT_ACTIVATED);
    }

    if (!credential.is_active && credential.password_hash) {
      throw new ForbiddenException(ERROR_MESSAGES.EMPLOYEE.DEACTIVATED);
    }

    if (!credential.password_hash) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await argon2.verify(
      credential.password_hash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    return this.generateTokenPair(credential);
  }

  async logout(refreshToken: string) {
    const payload = await this.jwt
      .verifyAsync<{ sub: string; type: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
      })
      .catch(() => null);

    if (payload?.type === 'refresh' && payload.sub) {
      await this.credentialRepository.update(
        { employee_id: payload.sub },
        { refresh_token_hash: null },
      );
    }

    return { message: 'Logged out successfully' };
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

    const credential = await this.credentialRepository.findOne({
      where: { employee_id: payload.sub },
      select: {
        id: true,
        employee_id: true,
        email: true,
        role: true,
        refresh_token_hash: true,
        is_active: true,
      },
    });

    if (
      !credential ||
      !credential.refresh_token_hash ||
      !credential.is_active
    ) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    const isRefreshTokenValid = await argon2.verify(
      credential.refresh_token_hash,
      refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    return this.generateTokenPair(credential);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    return this.credentialRepository.manager.transaction(async (manager) => {
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

      const credential = await manager.findOne(EmployeeAuthCredential, {
        where: { employee_id: token.employee_id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!credential) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }

      if (!credential.is_active) {
        throw new ForbiddenException(ERROR_MESSAGES.EMPLOYEE.DEACTIVATED);
      }

      const passwordHash = await argon2.hash(dto.password);
      const now = new Date();

      await manager.update(
        EmployeeAuthCredential,
        { id: credential.id },
        { password_hash: passwordHash, refresh_token_hash: null },
      );
      await manager.update(ActivationToken, { id: token.id }, { used_at: now });

      return { message: 'Password reset successfully' };
    });
  }

  async issueActivationToken(
    dto: IssueTokenDto,
    actorRole: EmployeeRole,
  ): Promise<{ raw_token: string }> {
    return this.issueToken(
      dto.employee_id,
      ActivationTokenPurpose.ACTIVATION_ACCOUNT,
      actorRole,
    );
  }

  async issueResetPasswordToken(
    dto: IssueTokenDto,
    actorRole: EmployeeRole,
  ): Promise<{ raw_token: string }> {
    return this.issueToken(
      dto.employee_id,
      ActivationTokenPurpose.RESET_PASSWORD,
      actorRole,
    );
  }

  async createCredential(
    dto: CreateCredentialDto,
  ): Promise<{ message: string }> {
    return this.credentialRepository.manager.transaction(async (manager) => {
      const existing = await manager.findOne(EmployeeAuthCredential, {
        where: [{ email: dto.email }, { employee_id: dto.employee_id }],
      });

      if (existing) {
        throw new ConflictException(
          ERROR_MESSAGES.AUTH.CREDENTIAL_ALREADY_EXISTS,
        );
      }

      await manager.save(
        EmployeeAuthCredential,
        manager.create(EmployeeAuthCredential, {
          employee_id: dto.employee_id,
          email: dto.email,
          role: dto.role,
          is_active: false,
          password_hash: null,
          refresh_token_hash: null,
        }),
      );

      return { message: 'Credential created successfully' };
    });
  }

  async updateCredential(
    employeeId: string,
    dto: UpdateCredentialDto,
  ): Promise<{ message: string }> {
    return this.credentialRepository.manager.transaction(async (manager) => {
      const credential = await manager.findOne(EmployeeAuthCredential, {
        where: { employee_id: employeeId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!credential) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }

      if (dto.email && dto.email !== credential.email) {
        const existing = await manager.findOne(EmployeeAuthCredential, {
          where: { email: dto.email },
        });

        if (existing && existing.employee_id !== employeeId) {
          throw new ConflictException(
            ERROR_MESSAGES.AUTH.CREDENTIAL_ALREADY_EXISTS,
          );
        }

        credential.email = dto.email;
      }

      if (dto.role) {
        credential.role = dto.role;
      }

      await manager.save(EmployeeAuthCredential, credential);

      return { message: 'Credential updated successfully' };
    });
  }

  async deactivateCredential(employeeId: string): Promise<{ message: string }> {
    return this.credentialRepository.manager.transaction(async (manager) => {
      const credential = await manager.findOne(EmployeeAuthCredential, {
        where: { employee_id: employeeId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!credential) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }

      await manager.update(
        EmployeeAuthCredential,
        { id: credential.id },
        {
          is_active: false,
          refresh_token_hash: null,
        },
      );

      await manager.update(
        ActivationToken,
        { employee_id: employeeId, used_at: IsNull() },
        { used_at: new Date() },
      );

      return { message: 'Credential deactivated successfully' };
    });
  }

  private async issueToken(
    employeeId: string,
    purpose: ActivationTokenPurpose,
    actorRole: EmployeeRole,
  ): Promise<{ raw_token: string }> {
    return this.credentialRepository.manager.transaction(async (manager) => {
      const credential = await manager.findOne(EmployeeAuthCredential, {
        where: { employee_id: employeeId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!credential) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }

      if (!canManageEmployeeRole(actorRole, credential.role)) {
        throw new ForbiddenException(ERROR_MESSAGES.AUTH.INSUFFICIENT_ROLE);
      }

      if (
        purpose === ActivationTokenPurpose.ACTIVATION_ACCOUNT &&
        (credential.is_active || credential.password_hash)
      ) {
        throw new ConflictException(
          ERROR_MESSAGES.AUTH.ACCOUNT_ALREADY_ACTIVATED,
        );
      }

      if (
        purpose === ActivationTokenPurpose.RESET_PASSWORD &&
        !credential.is_active
      ) {
        if (credential.password_hash) {
          throw new ForbiddenException(ERROR_MESSAGES.EMPLOYEE.DEACTIVATED);
        }
        throw new ConflictException(ERROR_MESSAGES.EMPLOYEE.NOT_ACTIVATED);
      }

      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const now = new Date();

      await manager.update(
        ActivationToken,
        {
          employee_id: employeeId,
          purpose,
          used_at: IsNull(),
        },
        { used_at: now },
      );

      await manager.save(
        ActivationToken,
        manager.create(ActivationToken, {
          token_hash: tokenHash,
          employee_id: employeeId,
          purpose,
          used_at: null,
          expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        }),
      );

      return { raw_token: token };
    });
  }

  private async generateTokenPair(credential: EmployeeAuthCredential): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshExpiredAt: Date;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(credential),
      this.signRefreshToken(credential),
    ]);

    const { exp } = this.jwt.decode<{ exp: number }>(refreshToken);
    const hashedRefreshToken = await argon2.hash(refreshToken);

    await this.credentialRepository.update(
      { id: credential.id },
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

  private signAccessToken(credential: EmployeeAuthCredential): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: credential.employee_id,
        role: credential.role,
        email: credential.email,
        type: 'access',
      },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<StringValue>('JWT_EXP') ?? '30m',
      },
    );
  }

  private signRefreshToken(
    credential: EmployeeAuthCredential,
  ): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: credential.employee_id,
        type: 'refresh',
      },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<StringValue>('JWT_REFRESH_EXP') ?? '7d',
      },
    );
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
}
