import { Module } from '@nestjs/common';
import * as providers from '../providers';
import * as workerProviders from './providers';
import { getInjectables } from '../utils';

@Module({
  imports: [],
  providers: [
    ...getInjectables(providers).filter(
      (provider) => provider !== providers.WorkerService,
    ),
    ...getInjectables(workerProviders),
  ],
})
export class WorkerModule {}
