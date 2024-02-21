import { Module } from '@nestjs/common';
import * as providers from '../providers';
import * as workerProviders from './providers';
import { NestClassCollection } from '../utils';

@Module({
  imports: [],
  providers: NestClassCollection.fromInjectables(providers)
    .concat(NestClassCollection.fromInjectables(workerProviders))
    .toArray(),
})
export class WorkerModule {}
