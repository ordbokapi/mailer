import { Injectable, Logger } from '@nestjs/common';
import * as workerThreads from 'worker_threads';
import { AppSecretsService } from './app-secrets.provider';
import { WorkerExitCodes } from '../worker/worker-exit-codes';

@Injectable()
/**
 * Starts a worker service that connects to Redis and processes the email queue.
 * This is done in a separate process to avoid blocking the main thread.
 */
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);
  #worker: workerThreads.Worker | undefined;
  #workerInitialized = false;
  #stopped = false;

  constructor(private readonly appSecrets: AppSecretsService) {
    this.startWorker();
  }

  private startWorker() {
    this.logger.debug('Starting worker');

    this.#workerInitialized = false;
    this.#worker = new workerThreads.Worker('./dist/worker/entrypoint.js', {
      workerData: { logLevels: (globalThis as any).logLevels },
    });

    this.#worker.on('exit', (code) => {
      this.logger.error(`Worker exited with code ${code}`);
      if (!this.#stopped) {
        if (code === WorkerExitCodes.MailTransportError) {
          const waitMinutes = 15;

          this.logger.error(
            `Restarting worker in ${waitMinutes} minutes due to mail transport error`,
          );
          setTimeout(() => this.startWorker(), waitMinutes * 60 * 1000);
        } else {
          this.startWorker();
        }
      }
    });

    this.#worker.on('message', (message) => {
      if (message === 'startup') {
        this.#workerInitialized = true;
      }
    });

    this.logger.log('Worker started');
  }

  /**
   * Stops the worker service when the application is shutting down.
   */
  async beforeApplicationShutdown(): Promise<void> {
    this.#stopped = true;

    if (!this.#worker) {
      return;
    }

    if (!this.#workerInitialized) {
      this.logger.log('Terminating worker');
      await this.#worker.terminate();

      return;
    }

    this.logger.log('Sending stop message to worker');
    this.#worker.postMessage('stop');

    await new Promise<void>((resolve) => {
      this.#worker!.on('message', (message) => {
        if (message === 'shutdown') {
          resolve();
        }
      });
    });
  }
}
