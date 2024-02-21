import {
  Body,
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AppSecretsService,
  EmailQueueService,
  SanitizationService,
} from '../providers';

@Controller()
export class NotifyController {
  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly sanitizer: SanitizationService,
    private readonly secrets: AppSecretsService,
  ) {}

  @Post('/new-post')
  @HttpCode(HttpStatus.ACCEPTED)
  async newPost(
    @Headers('Authorization') authorization: string,
    @Body('title') title: string,
    @Body('url') url: string,
    @Body('summary') summary: string,
  ): Promise<void> {
    if (authorization !== this.secrets.apiKey) {
      throw new UnauthorizedException();
    }

    await this.emailQueue.queueNewPostEmail({
      title: this.sanitizer.sanitizeText(title, { maxLength: 100 }),
      url: this.sanitizer.sanitizeUrl(url),
      summary: this.sanitizer.sanitizeText(summary),
    });
  }
}
