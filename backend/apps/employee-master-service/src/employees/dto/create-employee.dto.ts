import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import {
  EmployeeRole,
  ToIndonesianPhoneNumber,
  ToLowerCaseTrim,
  ToTitleCaseTrim,
} from '@app/common';
import { MaritalStatus, Religion } from '../entities/employee.entity.js';

export class CreateEmployeeDto {
  @ToTitleCaseTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  full_name: string;

  @ToLowerCaseTrim()
  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsDefined()
  @IsNumberString({ no_symbols: true })
  @Length(16, 16)
  nik: string;

  @ToIndonesianPhoneNumber()
  @IsString()
  @MaxLength(20)
  @IsPhoneNumber('ID')
  phone_number: string;

  @IsEnum(EmployeeRole)
  role: EmployeeRole;

  @ToTitleCaseTrim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  birth_place: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  birth_date: string;

  @IsOptional()
  @IsEnum(MaritalStatus)
  marital_status?: MaritalStatus | null;

  @IsOptional()
  @IsEnum(Religion)
  religion?: Religion | null;
}
