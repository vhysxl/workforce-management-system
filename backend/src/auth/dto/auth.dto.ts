import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { ToLowerCaseTrim } from '../../common/decorators/to-lower-case.decorator.js';

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

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
