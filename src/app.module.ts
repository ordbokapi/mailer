import { MiddlewareConsumer, Module } from '@nestjs/common';
import * as controllers from './controllers';
import * as providers from './providers';
import { RequestLoggerMiddleware } from './request-logger.middleware';
import { getInjectables } from './utils';

@Module({
  imports: [],
  controllers: Object.values(controllers),
  providers: getInjectables(providers),
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
