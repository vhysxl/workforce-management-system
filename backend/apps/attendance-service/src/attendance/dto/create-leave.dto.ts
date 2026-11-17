import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { LeaveType } from '../entities/attendance.entity.js';

export class CreateLeaveDto {
  @IsEnum(LeaveType)
  type: LeaveType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  detail: string;
}
