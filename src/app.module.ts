import { MiddlewareConsumer, Module } from '@nestjs/common';
import * as controllers from './controllers';
import {
  CryptoService,
  MailService,
  getAppSecretsProvider,
  TemplateService,
  WorkerService,
} from './providers';
import { RequestLoggerMiddleware } from './request-logger.middleware';

@Module({
  imports: [],
  controllers: Object.values(controllers),
  providers: [
    CryptoService,
    MailService,
    getAppSecretsProvider(),
    TemplateService,
    WorkerService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
