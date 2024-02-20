import { NestFactory } from '@nestjs/core';
import { workerData, parentPort } from 'worker_threads';
import { WorkerModule } from './worker.module';
import type { WorkerData } from './worker-data';
import { WorkerLogger } from './worker-logger';
import { isProd } from '../utils';

async function bootstrap() {
  if (!workerData || !parentPort) {
    throw new Error('Worker must be started with workerData and parentPort');
  }

  const { logLevels } = workerData as WorkerData;

  // Disable colour logging in production
  if (isProd()) {
    process.env.NO_COLOR = 'true';
  }

  const logger = new WorkerLogger('Worker', { logLevels });

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger,
  });

  app.enableShutdownHooks();

  // begin exiting when parent thread sends "stop" message
  parentPort.on('message', (message) => {
    if (message === 'stop') {
      logger.log('Received stop message from parent thread');
      app.close();
    }
  });
}

bootstrap();
