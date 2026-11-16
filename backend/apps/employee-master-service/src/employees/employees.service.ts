import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import {
  EmployeeRole,
  ERROR_MESSAGES,
} from '@app/common';
import { AuthClientService } from './auth-client.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { Employee } from './entities/employee.entity.js';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    private readonly authClient: AuthClientService,
  ) {}

  async create(dto: CreateEmployeeDto) {
    try {
      return await this.employeesRepository.manager.transaction(
        async (manager) => {
          const whereClause = [{ email: dto.email }, { nik: dto.nik }];

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
            nik: dto.nik,
            phone_number: dto.phone_number,
            role: dto.role,
            birth_place: dto.birth_place,
            birth_date: dto.birth_date,
            marital_status: dto.marital_status ?? null,
            religion: dto.religion ?? null,
          });

          const savedEmployee = await manager.save(Employee, employee);

          // Downstream call to auth-service
          await this.authClient.createCredential({
            employee_id: savedEmployee.id,
            email: savedEmployee.email,
            role: savedEmployee.role,
          });

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
        is_activated === 1
          ? 'employee.activated_at IS NOT NULL'
          : 'employee.activated_at IS NULL',
      );
    }

    if (is_deactivated !== undefined) {
      qb.andWhere(
        is_deactivated === 1
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
          const employee = await manager
            .createQueryBuilder(Employee, 'employee')
            .setLock('pessimistic_write')
            .addSelect('employee.nik')
            .where('employee.id = :id', { id })
            .getOne();

          if (!employee) {
            throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
          }

          if (employee.deactivated_at) {
            throw new ConflictException(
              ERROR_MESSAGES.EMPLOYEE.ALREADY_DEACTIVATED,
            );
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

          const isEmailChanged = dto.email && dto.email !== employee.email;
          const isRoleChanged = targetRole !== employee.role;

          employee.full_name = dto.full_name;
          employee.email = dto.email;
          employee.nik = dto.nik;
          employee.address = dto.address ?? null;
          employee.phone_number = dto.phone_number;
          employee.role = targetRole;
          employee.birth_place = dto.birth_place;
          employee.birth_date = dto.birth_date;
          employee.marital_status = dto.marital_status ?? null;
          employee.religion = dto.religion ?? null;

          const updated = await manager.save(Employee, employee);

          // Downstream sync to auth-service if email or role changed
          if (isEmailChanged || isRoleChanged) {
            const authPayload: { email?: string; role?: EmployeeRole } = {};
            if (isEmailChanged) authPayload.email = dto.email;
            if (isRoleChanged) authPayload.role = targetRole;

            await this.authClient.updateCredential(id, authPayload);
          }

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
        await this.authClient.deactivateCredential(id);

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
      nik: employee.nik,
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
