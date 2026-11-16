import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { EmployeeRole, ToLowerCaseTrim } from '@app/common';

export class CheckTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class LoginDto {
  @ToLowerCaseTrim()
  @MaxLength(50)
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password: string;
}

export class ActivateAccountDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MaxLength(255)
  @IsStrongPassword({
    minLength: 8,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
    minLowercase: 1,
  })
  password: string;
}

export class ResetPasswordDto extends ActivateAccountDto {}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class IssueTokenDto {
  @IsUUID()
  @IsNotEmpty()
  employee_id: string;
}

export class CreateCredentialDto {
  @IsUUID()
  @IsNotEmpty()
  employee_id: string;

  @ToLowerCaseTrim()
  @MaxLength(150)
  @IsEmail()
  email: string;

  @IsEnum(EmployeeRole)
  role: EmployeeRole;
}

export class UpdateCredentialDto {
  @IsOptional()
  @ToLowerCaseTrim()
  @MaxLength(150)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;
}
