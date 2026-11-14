import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const mySqlConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.getOrThrow<string>('database.host'),
  port: config.getOrThrow<number>('database.port'),
  username: config.getOrThrow<string>('database.username'),
  password: config.getOrThrow<string>('database.password'),
  database: config.getOrThrow<string>('database.name'),
  synchronize: true,
  autoLoadEntities: true,

  logging: ['error'],
});
