import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import {
  EmployeeRole,
  ERROR_MESSAGES,
} from '@app/common';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { Employee } from './entities/employee.entity.js';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateEmployeeDto) {
    const authUrl =
      this.configService.get<string>('services.auth.url') ??
      'http://localhost:3001/api';

    try {
      return await this.employeesRepository.manager.transaction(
        async (manager) => {
          const whereClause = dto.nik
            ? [{ email: dto.email }, { nik: dto.nik }]
            : [{ email: dto.email }];

          const existing = await manager.findOne(Employee, {
            where: whereClause,
          });

          if (existing) {
            throw new ConflictException(ERROR_MESSAGES.EMPLOYEE.ALREADY_EXISTS);
          }

          const employee = manager.create(Employee, {
            full_name: dto.full_name,
            email: dto.email,
            address: dto.address ?? null,
            nik: dto.nik ?? null,
            phone_number: dto.phone_number,
            role: dto.role ?? EmployeeRole.EMPLOYEE,
            birth_place: dto.birth_place,
            birth_date: dto.birth_date,
            marital_status: dto.marital_status ?? null,
            religion: dto.religion ?? null,
          });

          const savedEmployee = await manager.save(Employee, employee);

          // Downstream call to auth-service
          let authRes: Response;
          try {
            authRes = await fetch(`${authUrl}/auth/internal/credentials`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                employee_id: savedEmployee.id,
                email: savedEmployee.email,
                role: savedEmployee.role,
              }),
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

          return this.toDetailResponse(savedEmployee);
        },
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        'code' in (error.driverError as { code?: string }) &&
        (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(ERROR_MESSAGES.EMPLOYEE.ALREADY_EXISTS);
      }

      throw error;
    }
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, search, is_activated, is_deactivated } = query;
    const skip = (page - 1) * limit;

    const qb = this.employeesRepository.createQueryBuilder('employee');

    if (search) {
      qb.andWhere(
        '(employee.full_name LIKE :search OR employee.email LIKE :search OR employee.phone_number LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (is_activated !== undefined) {
      qb.andWhere(
        is_activated
          ? 'employee.activated_at IS NOT NULL'
          : 'employee.activated_at IS NULL',
      );
    }

    if (is_deactivated !== undefined) {
      qb.andWhere(
        is_deactivated
          ? 'employee.deactivated_at IS NOT NULL'
          : 'employee.deactivated_at IS NULL',
      );
    }

    const [employees, total] = await qb
      .skip(skip)
      .take(limit)
      .orderBy('employee.created_at', 'DESC')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: employees.map((emp) => this.toResponse(emp)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string, actorRole?: EmployeeRole, actorId?: string) {
    if (actorRole === EmployeeRole.EMPLOYEE && actorId && actorId !== id) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.INSUFFICIENT_ROLE);
    }

    const employee = await this.employeesRepository
      .createQueryBuilder('employee')
      .addSelect('employee.nik')
      .where('employee.id = :id', { id })
      .getOne();

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    return this.toDetailResponse(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto, actorRole: EmployeeRole) {
    if (actorRole !== EmployeeRole.ADMIN && actorRole !== EmployeeRole.HRD) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.INSUFFICIENT_ROLE);
    }

    try {
      return await this.employeesRepository.manager.transaction(
        async (manager) => {
          const employee = await manager.findOne(Employee, {
            where: { id },
            lock: { mode: 'pessimistic_write' },
          });

          if (!employee) {
            throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
          }

          const allowedRoles =
            actorRole === EmployeeRole.ADMIN
              ? [EmployeeRole.HRD, EmployeeRole.EMPLOYEE]
              : [EmployeeRole.EMPLOYEE];

          const targetRole = dto.role ?? employee.role;

          if (
            !allowedRoles.includes(employee.role) ||
            !allowedRoles.includes(targetRole)
          ) {
            throw new ForbiddenException(ERROR_MESSAGES.AUTH.INSUFFICIENT_ROLE);
          }

          employee.full_name = dto.full_name;
          employee.email = dto.email;
          employee.address = dto.address ?? null;
          employee.nik = dto.nik ?? null;
          employee.phone_number = dto.phone_number;
          employee.role = targetRole;
          employee.birth_place = dto.birth_place;
          employee.birth_date = dto.birth_date;
          employee.marital_status = dto.marital_status ?? null;
          employee.religion = dto.religion ?? null;

          const updated = await manager.save(Employee, employee);
          return this.toDetailResponse(updated);
        },
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        'code' in (error.driverError as { code?: string }) &&
        (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(ERROR_MESSAGES.EMPLOYEE.ALREADY_EXISTS);
      }

      throw error;
    }
  }

  async deactivate(id: string, actorRole: EmployeeRole, actorId: string) {
    if (actorRole !== EmployeeRole.ADMIN && actorRole !== EmployeeRole.HRD) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.INSUFFICIENT_ROLE);
    }

    if (id === actorId) {
      throw new ForbiddenException(
        ERROR_MESSAGES.EMPLOYEE.CANNOT_DEACTIVATE_SELF,
      );
    }

    const authUrl =
      this.configService.get<string>('services.auth.url') ??
      'http://localhost:3001/api';

    return await this.employeesRepository.manager.transaction(
      async (manager) => {
        const employee = await manager.findOne(Employee, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!employee) {
          throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
        }

        const allowedRoles =
          actorRole === EmployeeRole.ADMIN
            ? [EmployeeRole.HRD, EmployeeRole.EMPLOYEE]
            : [EmployeeRole.EMPLOYEE];

        if (!allowedRoles.includes(employee.role)) {
          throw new ForbiddenException(ERROR_MESSAGES.AUTH.INSUFFICIENT_ROLE);
        }

        if (employee.deactivated_at) {
          throw new ConflictException(
            ERROR_MESSAGES.EMPLOYEE.ALREADY_DEACTIVATED,
          );
        }

        employee.deactivated_at = new Date();
        const updated = await manager.save(Employee, employee);

        // Downstream call to auth-service
        let authRes: Response;
        try {
          authRes = await fetch(
            `${authUrl}/auth/internal/credentials/${id}/deactivate`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
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
          this.logger.error(
            ERROR_MESSAGES.SERVICE.FAILED('Auth Service', authRes.status),
          );
          throw new InternalServerErrorException(
            ERROR_MESSAGES.EMPLOYEE.DEACTIVATION_FAILED,
          );
        }

        return this.toResponse(updated);
      },
    );
  }

  async activateAccount(id: string) {
    const employee = await this.employeesRepository.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    employee.activated_at = new Date();
    await this.employeesRepository.save(employee);

    return { message: 'Employee activated successfully' };
  }

  private toResponse(employee: Employee) {
    return {
      id: employee.id,
      full_name: employee.full_name,
      email: employee.email,
      address: employee.address,
      phone_number: employee.phone_number,
      role: employee.role,
      birth_place: employee.birth_place,
      birth_date: employee.birth_date,
      marital_status: employee.marital_status,
      religion: employee.religion,
      activated_at: employee.activated_at,
      deactivated_at: employee.deactivated_at,
      created_at: employee.created_at,
      updated_at: employee.updated_at,
    };
  }

  private toDetailResponse(employee: Employee) {
    return {
      id: employee.id,
      full_name: employee.full_name,
      email: employee.email,
      address: employee.address,
      nik: employee.nik ?? null,
      phone_number: employee.phone_number,
      role: employee.role,
      birth_place: employee.birth_place,
      birth_date: employee.birth_date,
      marital_status: employee.marital_status,
      religion: employee.religion,
      activated_at: employee.activated_at,
      deactivated_at: employee.deactivated_at,
      created_at: employee.created_at,
      updated_at: employee.updated_at,
    };
  }
}
