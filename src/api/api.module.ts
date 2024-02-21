import { MiddlewareConsumer, Module } from '@nestjs/common';
import * as controllers from '../controllers';
import * as providers from '../providers';
import { RequestLoggerMiddleware } from './request-logger.middleware';
import { NestClassCollection } from '../utils';

@Module({
  imports: [],
  controllers: NestClassCollection.fromControllers(controllers)
    .forEnvironment()
    .toArray(),
  providers: NestClassCollection.fromInjectables(providers)
    .forEnvironment()
    .toArray(),
})
export class ApiModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
