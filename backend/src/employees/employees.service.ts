import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { createHash, randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';

import { ERROR_MESSAGES } from '../common/constants/error-messages.constant.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import {
  ActivationToken,
  ActivationTokenPurpose,
} from './entities/activation_token.entities.js';
import { Employee } from './entities/employee.entity.js';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
  ) {}

  // create(createEmployeeDto: CreateEmployeeDto) {
  //   return this.employeesRepository.create(createEmployeeDto);
  // }

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

  async findByEmailWithPassword(email: string): Promise<Employee | null> {
    const employee = await this.employeesRepository.findOne({
      where: { email: email },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        password_hash: true,
      },
    });

    return employee;
  }

  async issueActivationToken(
    employeeId: string,
  ): Promise<{ raw_token: string }> {
    return this.employeesRepository.manager.transaction(async (manager) => {
      const employee = await manager.findOne(Employee, {
        where: { id: employeeId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!employee) {
        throw new NotFoundException(ERROR_MESSAGES.EMPLOYEE.NOT_FOUND);
      }

      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const now = new Date();

      // invalidate older token
      await manager.update(
        ActivationToken,
        {
          employee_id: employeeId,
          purpose: ActivationTokenPurpose.ACTIVATION_ACCOUNT,
          used_at: IsNull(),
        },
        { used_at: now },
      );

      // create new token
      await manager.save(
        ActivationToken,
        manager.create(ActivationToken, {
          token_hash: tokenHash,
          employee_id: employeeId,
          purpose: ActivationTokenPurpose.ACTIVATION_ACCOUNT,
          used_at: null,
          expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        }),
      );

      return { raw_token: token };
    });
  }

  // update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
  //   return `This action updates a #${id} employee`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} employee`;
  // }
}
