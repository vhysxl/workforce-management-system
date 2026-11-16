import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { EmployeeMasterServiceModule } from './employee-master-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(EmployeeMasterServiceModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:8000', 'http://localhost:8001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = config.get<number>('app.port', 3002);
  await app.listen(port);
}
await bootstrap();
