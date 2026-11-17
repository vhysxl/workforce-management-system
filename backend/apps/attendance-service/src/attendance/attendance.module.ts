import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtGuard, RolesGuard } from '@app/common';

import { AttendanceController } from './attendance.controller.js';
import { AttendanceService } from './attendance.service.js';
import { Attendance } from './entities/attendance.entity.js';

@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([Attendance])],
  controllers: [AttendanceController],
  providers: [AttendanceService, JwtGuard, RolesGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
