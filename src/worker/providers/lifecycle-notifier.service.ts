import { Injectable } from '@nestjs/common';
import { parentPort } from 'worker_threads';

@Injectable()
export class LifecycleNotifierService {
  /**
   * Notifies the parent thread that the worker has started.
   */
  async onApplicationBootstrap(): Promise<void> {
    parentPort?.postMessage('startup');
  }

  /**
   * Notifies the parent thread that the worker is shutting down.
   */
  async onApplicationShutdown(): Promise<void> {
    parentPort?.postMessage('shutdown');
  }
}
