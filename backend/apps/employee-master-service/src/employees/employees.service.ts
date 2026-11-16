import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ERROR_MESSAGES } from '@app/common';
import { Employee } from './entities/employee.entity.js';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
  ) {}

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
}
