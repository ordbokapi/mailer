import { Inject, Injectable, Logger } from '@nestjs/common';
import * as workerThreads from 'worker_threads';
import { IAppSecrets } from './i-app-secrets';

@Injectable()
/**
 * Starts a worker service that connects to Redis and processes the email queue.
 * This is done in a separate process to avoid blocking the main thread.
 */
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(@Inject('IAppSecrets') private readonly appSecrets: IAppSecrets) {
    this.startWorker();
  }

  private startWorker() {
    const worker = new workerThreads.Worker('./dist/worker/entrypoint.js', {
      workerData: this.appSecrets,
    });

    worker.on('exit', (code) => {
      this.logger.error(`Worker exited with code ${code}`);
      this.startWorker();
    });

    this.logger.log('Worker started');
  }
}
