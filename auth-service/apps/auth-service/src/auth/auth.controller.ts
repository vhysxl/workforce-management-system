import {
  Body,
  Controller,
  Cookies,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { ERROR_MESSAGES } from '../common/constants/error-messages.constant.js';
import { AUTH_CONSTANTS } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import {
  ActivateAccountDto,
  CheckTokenDto,
  LoginDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  @Get('check-token')
  @Header('Cache-Control', 'no-store')
  checkToken(@Query() dto: CheckTokenDto) {
    return this.authService.checkToken(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('activate-account')
  activateAccount(@Body() dto: ActivateAccountDto) {
    return this.authService.activateAccount(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: unknown,
  ) {
    const result = await this.authService.resetPassword(dto);
    this.clearRefreshCookie(res, AUTH_CONSTANTS.REFRESH_COOKIE);
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginAuthDto: LoginDto,
    @Res({ passthrough: true }) res: unknown,
  ) {
    const { accessToken, refreshToken, refreshExpiredAt } =
      await this.authService.login(loginAuthDto);

    this.setRefreshCookie(
      res,
      AUTH_CONSTANTS.REFRESH_COOKIE,
      refreshToken,
      refreshExpiredAt,
    );

    return {
      token: accessToken,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Cookies(AUTH_CONSTANTS.REFRESH_COOKIE) refreshToken: string | undefined,
    @Res({ passthrough: true }) res: unknown,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.MISSING_REFRESH_TOKEN,
      );
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      refreshExpiredAt,
    } = await this.authService.refresh(refreshToken);

    this.setRefreshCookie(
      res,
      AUTH_CONSTANTS.REFRESH_COOKIE,
      newRefreshToken,
      refreshExpiredAt,
    );

    return {
      token: accessToken,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Cookies(AUTH_CONSTANTS.REFRESH_COOKIE) refreshToken: string | undefined,
    @Res({ passthrough: true }) res: unknown,
  ) {
    this.clearRefreshCookie(res, AUTH_CONSTANTS.REFRESH_COOKIE);
    if (!refreshToken) return { message: 'Logged out successfully' };
    return this.authService.logout(refreshToken);
  }

  private setRefreshCookie(
    res: unknown,
    val_name: string,
    val: string,
    expires: Date,
  ) {
    this.adapterHost.httpAdapter.setCookie(res, val_name, val, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: expires,
      secure: false,
    });
  }

  private clearRefreshCookie(res: unknown, val_name: string) {
    this.adapterHost.httpAdapter.clearCookie(
      res,
      AUTH_CONSTANTS.REFRESH_COOKIE,
    );
  }
}
