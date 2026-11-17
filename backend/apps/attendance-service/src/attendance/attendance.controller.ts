import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { EmployeeRole, JwtGuard, Roles, RolesGuard } from '@app/common';
import type { AuthenticatedRequest } from '@app/common';
import type { Response } from 'express';

import { AttendanceService } from './attendance.service.js';
import { AttendanceCalendarQueryDto } from './dto/attendance-calendar-query.dto.js';
import { ClockInWfhDto } from './dto/clock-in-wfh.dto.js';
import { CreateLeaveDto } from './dto/create-leave.dto.js';
import {
  MAX_IMAGE_SIZE,
  createAttendanceDiskStorage,
  imageFileFilter,
} from './helpers/file-upload.helper.js';

@Controller('attendance')
@UseGuards(JwtGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @HttpCode(HttpStatus.OK)
  @Post('wfo/clock-in')
  @Roles([EmployeeRole.EMPLOYEE, EmployeeRole.HRD])
  clockInWfo(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.clockInWfo(req.user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Post('wfo/clock-out')
  @Roles([EmployeeRole.EMPLOYEE, EmployeeRole.HRD])
  clockOutWfo(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.clockOutWfo(req.user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Post('wfh')
  @Roles([EmployeeRole.EMPLOYEE, EmployeeRole.HRD])
  @UseInterceptors(
    FileInterceptor('image', {
      storage: createAttendanceDiskStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  clockInWfh(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ClockInWfhDto,
  ) {
    return this.attendanceService.clockInWfh(req.user.sub, file, dto.detail);
  }

  @HttpCode(HttpStatus.OK)
  @Post('leave')
  @Roles([EmployeeRole.EMPLOYEE, EmployeeRole.HRD])
  @UseInterceptors(
    FileInterceptor('image', {
      storage: createAttendanceDiskStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
  )
  submitLeave(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateLeaveDto,
  ) {
    return this.attendanceService.submitLeave(req.user.sub, file, dto);
  }

  @Get('today')
  @Roles([EmployeeRole.EMPLOYEE, EmployeeRole.HRD])
  getTodayAttendance(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.getTodayAttendance(req.user.sub);
  }

  @Get('my-history')
  @Roles([EmployeeRole.EMPLOYEE, EmployeeRole.HRD])
  getMyHistory(
    @Req() req: AuthenticatedRequest,
    @Query() query: AttendanceCalendarQueryDto,
  ) {
    return this.attendanceService.getCalendarHistory(req.user.sub, query);
  }

  @Get('employees/:employeeId')
  @Roles([EmployeeRole.HRD, EmployeeRole.ADMIN])
  getEmployeeHistory(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Query() query: AttendanceCalendarQueryDto,
  ) {
    return this.attendanceService.getCalendarHistory(employeeId, query);
  }

  @Get('attachments/:employeeId/:filename')
  @Roles([EmployeeRole.EMPLOYEE, EmployeeRole.HRD, EmployeeRole.ADMIN])
  getAttachment(
    @Req() req: AuthenticatedRequest,
    @Param('employeeId') employeeId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = this.attendanceService.getAttachmentPath(
      req.user,
      employeeId,
      filename,
    );
    return res.sendFile(filePath);
  }
}
