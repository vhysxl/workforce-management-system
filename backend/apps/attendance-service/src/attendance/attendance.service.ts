import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { ERROR_MESSAGES, EmployeeRole } from '@app/common';
import type { AccessTokenPayload } from '@app/common';
import { existsSync, unlinkSync } from 'node:fs';
import { basename, parse, resolve } from 'node:path';
import { Repository } from 'typeorm';

import { AttendanceCalendarQueryDto } from './dto/attendance-calendar-query.dto.js';
import { CreateLeaveDto } from './dto/create-leave.dto.js';
import { Attendance, WorkType } from './entities/attendance.entity.js';
import {
  AttendanceResponse,
  OFFICE_END_TOTAL_MINUTES,
  formatAttendanceResponse,
} from './helpers/attendance-calculator.helper.js';

const CLOCK_IN_START_TOTAL_MINUTES = 7 * 60;

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly configService: ConfigService,
  ) {}

  async clockInWfo(employeeId: string): Promise<AttendanceResponse> {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < CLOCK_IN_START_TOTAL_MINUTES || minutes >= OFFICE_END_TOTAL_MINUTES) {
      throw new BadRequestException(ERROR_MESSAGES.ATTENDANCE.CLOCK_IN_CLOSED);
    }
    const today = this.getTodayDateString(now);

    const existing = await this.attendanceRepository.findOne({
      where: { employee_id: employeeId, date: today },
    });

    if (existing) {
      throw new ConflictException(
        ERROR_MESSAGES.ATTENDANCE.ALREADY_RECORDED_TODAY,
      );
    }

    const attendance = this.attendanceRepository.create({
      employee_id: employeeId,
      date: today,
      type: WorkType.WFO,
      clock_in: now,
      clock_out: null,
      image_path: null,
      detail: null,
    });

    const saved = await this.attendanceRepository.save(attendance);
    return formatAttendanceResponse(saved);
  }

  async clockOutWfo(employeeId: string): Promise<AttendanceResponse> {
    const today = this.getTodayDateString();

    const attendance = await this.attendanceRepository.findOne({
      where: { employee_id: employeeId, date: today },
    });

    if (!attendance) {
      throw new NotFoundException(ERROR_MESSAGES.ATTENDANCE.NOT_FOUND_TODAY);
    }

    if (attendance.type !== WorkType.WFO) {
      throw new BadRequestException(
        ERROR_MESSAGES.ATTENDANCE.INVALID_CLOCK_OUT_TYPE(
          attendance.type.toUpperCase(),
        ),
      );
    }

    if (attendance.clock_out) {
      throw new ConflictException(
        ERROR_MESSAGES.ATTENDANCE.ALREADY_CLOCKED_OUT,
      );
    }

    attendance.clock_out = new Date();
    const updated = await this.attendanceRepository.save(attendance);
    return formatAttendanceResponse(updated);
  }

  async clockInWfh(
    employeeId: string,
    file?: Express.Multer.File,
    detail?: string,
  ): Promise<AttendanceResponse> {
    if (!file) {
      throw new BadRequestException(
        ERROR_MESSAGES.ATTENDANCE.WFH_IMAGE_REQUIRED,
      );
    }

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < CLOCK_IN_START_TOTAL_MINUTES || minutes >= OFFICE_END_TOTAL_MINUTES) {
      this.cleanUpUploadedFile(file.path);
      throw new BadRequestException(ERROR_MESSAGES.ATTENDANCE.CLOCK_IN_CLOSED);
    }
    const today = this.getTodayDateString(now);

    const existing = await this.attendanceRepository.findOne({
      where: { employee_id: employeeId, date: today },
    });

    if (existing) {
      this.cleanUpUploadedFile(file.path);
      throw new ConflictException(
        ERROR_MESSAGES.ATTENDANCE.ALREADY_RECORDED_TODAY,
      );
    }

    const attendanceId = parse(file.filename).name;

    const attendance = this.attendanceRepository.create({
      id: attendanceId,
      employee_id: employeeId,
      date: today,
      type: WorkType.WFH,
      clock_in: now,
      clock_out: null,
      image_path: file.path.replace(/\\/g, '/'),
      detail: detail ?? null,
    });

    const saved = await this.attendanceRepository.save(attendance);
    return formatAttendanceResponse(saved);
  }

  async submitLeave(
    employeeId: string,
    file: Express.Multer.File | undefined,
    dto: CreateLeaveDto,
  ): Promise<AttendanceResponse> {
    if (!file) {
      throw new BadRequestException(
        ERROR_MESSAGES.ATTENDANCE.LEAVE_IMAGE_REQUIRED(dto.type.toUpperCase()),
      );
    }

    const today = this.getTodayDateString();

    const existing = await this.attendanceRepository.findOne({
      where: { employee_id: employeeId, date: today },
    });

    if (existing) {
      this.cleanUpUploadedFile(file.path);
      throw new ConflictException(
        ERROR_MESSAGES.ATTENDANCE.ALREADY_RECORDED_TODAY,
      );
    }

    const attendanceId = parse(file.filename).name;
    const now = new Date();

    const attendance = this.attendanceRepository.create({
      id: attendanceId,
      employee_id: employeeId,
      date: today,
      type: dto.type,
      clock_in: now,
      clock_out: null,
      image_path: file.path.replace(/\\/g, '/'),
      detail: dto.detail,
    });

    const saved = await this.attendanceRepository.save(attendance);
    return formatAttendanceResponse(saved);
  }

  async getTodayAttendance(
    employeeId: string,
  ): Promise<AttendanceResponse | null> {
    const today = this.getTodayDateString();

    const attendance = await this.attendanceRepository.findOne({
      where: { employee_id: employeeId, date: today },
    });

    return attendance ? formatAttendanceResponse(attendance) : null;
  }

  async getCalendarHistory(
    employeeId: string,
    query: AttendanceCalendarQueryDto,
  ): Promise<{
    year: number;
    month: number | null;
    total: number;
    data: AttendanceResponse[];
  }> {
    const currentYear = new Date().getFullYear();
    const year = query.year ?? currentYear;
    const month = query.month;

    let startDate: string;
    let endDate: string;

    if (month !== undefined) {
      const monthStr = String(month).padStart(2, '0');
      startDate = `${year}-${monthStr}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    } else {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    const qb = this.attendanceRepository
      .createQueryBuilder('att')
      .where('att.employee_id = :employeeId', { employeeId })
      .andWhere('att.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (query.type) {
      qb.andWhere('att.type = :type', { type: query.type });
    }

    const attendances = await qb.orderBy('att.date', 'ASC').getMany();

    return {
      year,
      month: month ?? null,
      total: attendances.length,
      data: attendances.map((item) => formatAttendanceResponse(item)),
    };
  }

  getAttachmentPath(
    user: AccessTokenPayload,
    targetEmployeeId: string,
    filename: string,
  ): string {
    const isOwner = user.sub === targetEmployeeId;
    const isHrdOrAdmin =
      user.role === EmployeeRole.HRD || user.role === EmployeeRole.ADMIN;

    if (!isOwner && !isHrdOrAdmin) {
      throw new ForbiddenException(
        ERROR_MESSAGES.ATTENDANCE.ATTACHMENT_FORBIDDEN,
      );
    }

    const sanitizedFilename = basename(filename);
    const baseUploadDir =
      this.configService.get<string>('app.uploadDir') ?? './uploads/attendance';
    const resolvedPath = resolve(
      baseUploadDir,
      targetEmployeeId,
      sanitizedFilename,
    );

    if (!existsSync(resolvedPath)) {
      throw new NotFoundException(
        ERROR_MESSAGES.ATTENDANCE.ATTACHMENT_NOT_FOUND,
      );
    }

    return resolvedPath;
  }

  private getTodayDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private cleanUpUploadedFile(filePath?: string) {
    if (filePath && existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        // ignore error
      }
    }
  }
}
