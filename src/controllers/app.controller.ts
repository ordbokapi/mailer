import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Header('Content-Type', 'text/html')
  getHello(): string {
    return 'Hello, World!';
  }
}
