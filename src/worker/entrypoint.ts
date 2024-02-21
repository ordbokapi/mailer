import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { LogLevel } from '@nestjs/common';

export async function start({ logLevels }: { logLevels: LogLevel[] }) {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: logLevels,
  });

  app.enableShutdownHooks();
}
