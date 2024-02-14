import { Controller, Get, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { TemplateService } from '../providers/template.service';

@Controller()
export class PreviewController {
  constructor(private readonly templateService: TemplateService) {}

  @Get('/preview/new-post')
  getHello(@Query('plain') plain: boolean, @Res() res: FastifyReply): string {
    const [html, text] = this.templateService.newPost({
      title: 'New Post',
      url: 'https://example.com/posts/123',
      summary: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat.`,
      unsubscribeUrl: 'https://example.com/unsubscribe/123',
    });

    if (plain) {
      res.header('Content-Type', 'text/plain');
      return text;
    }

    res.header('Content-Type', 'text/html');
    return html;
  }

  @Get('/preview/verification')
  getVerification(
    @Query('plain') plain: boolean,
    @Res() res: FastifyReply,
  ): string {
    const [html, text] = this.templateService.verification({
      verificationUrl: 'https://example.com/verify/123',
    });

    if (plain) {
      res.header('Content-Type', 'text/plain');
      return text;
    }

    res.header('Content-Type', 'text/html');
    return html;
  }

  @Get('/preview/signed-up')
  getSignedUp(
    @Query('plain') plain: boolean,
    @Res() res: FastifyReply,
  ): string {
    const [html, text] = this.templateService.signedUp({
      unsubscribeUrl: 'https://example.com/unsubscribe/123',
    });

    if (plain) {
      res.header('Content-Type', 'text/plain');
      return text;
    }

    res.header('Content-Type', 'text/html');
    return html;
  }
}
