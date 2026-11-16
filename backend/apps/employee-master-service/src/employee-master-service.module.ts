import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from './config/configuration.js';
import { mySqlConfig } from './config/database.config.js';
import { EmployeesModule } from './employees/employees.module.js';

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
    EmployeesModule,
  ],
})
export class EmployeeMasterServiceModule {}
