import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { EmployeeRole, ERROR_MESSAGES } from '@app/common';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { Employee } from './entities/employee.entity.js';

@Injectable()
export class EmployeesService {
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

          // downstream to auth-service
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
            throw new BadGatewayException(
              `Unable to connect to Auth Service: ${err instanceof Error ? err.message : String(err)}`,
            );
          }

          if (!authRes.ok) {
            const errBody = (await authRes.json().catch(() => ({}))) as {
              message?: string;
            };
            if (authRes.status === 409) {
              throw new ConflictException(
                errBody.message || ERROR_MESSAGES.AUTH.CREDENTIAL_ALREADY_EXISTS,
              );
            }
            throw new BadGatewayException(
              errBody.message || 'Downstream Auth Service returned an error',
            );
          }

          return this.toResponse(savedEmployee);
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

  findAll(): Promise<Employee[]> {
    return this.employeesRepository.find();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeesRepository
      .createQueryBuilder('employee')
      .addSelect('employee.nik')
      .where('employee.id = :id', { id })
      .getOne();

    if (!employee) {
      throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
    }

    return employee;
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
          return this.toResponse(updated);
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
}
