import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

import { EmployeeRole } from '@app/common';
import { MaritalStatus, Religion } from '../entities/employee.entity.js';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  full_name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address?: string;

  @IsOptional()
  @IsString()
  @Length(16, 16, { message: 'NIK must be exactly 16 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nik?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone_number: string;

  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  birth_place: string;

  @IsDateString()
  @IsNotEmpty()
  birth_date: string;

  @IsOptional()
  @IsEnum(MaritalStatus)
  marital_status?: MaritalStatus;

  @IsOptional()
  @IsEnum(Religion)
  religion?: Religion;
}
