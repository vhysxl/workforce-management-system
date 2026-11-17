import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttendanceModule } from './attendance/attendance.module.js';
import configuration from './config/configuration.js';
import { mySqlConfig } from './config/database.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: mySqlConfig,
    }),
    AttendanceModule,
  ],
})
export class AttendanceServiceModule {}
