import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

import { ToLowerCaseTrim } from '../../common/decorators/to-lower-case.decorator.js';

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
