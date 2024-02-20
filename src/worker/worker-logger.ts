import { ConsoleLogger } from '@nestjs/common';
import { threadId } from 'worker_threads';

export class WorkerLogger extends ConsoleLogger {
  protected override formatPid(pid: number): string {
    return `[Nest] ${pid}:${threadId}  - `;
  }
}
