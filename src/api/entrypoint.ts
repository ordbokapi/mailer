import { LogLevel, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as requestIp from 'request-ip';
import { AppSecretsService } from '../providers';
import { isProd } from '../utils';

export async function start({
  logLevels,
  port,
}: {
  logLevels: LogLevel[];
  port: number;
}) {
  const app = await NestFactory.create<NestFastifyApplication>(
    ApiModule,
    new FastifyAdapter(),
    { logger: logLevels },
  );

  app.use(requestIp.mw());

  app.useGlobalPipes(new ValidationPipe());

  const secrets = app.get(AppSecretsService);

  app.enableCors({
    origin: isProd()
      ? secrets.frontendUrl // allow only the frontend in production
      : '*', // allow all origins in development
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST'],
  });

  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
