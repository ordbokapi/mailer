import { Controller, Get, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { SubscriptionService, SanitizationService } from '../providers';

@Controller()
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly sanitizationService: SanitizationService,
  ) {}

  @Get('/subscribe')
  async subscribe(
    @Query('email') email: string,
    @Res() res: FastifyReply,
  ): Promise<void> {
    if (!email) {
      res.status(400).send('No email provided');
      return;
    }

    let sanitized: string;

    try {
      sanitized = this.sanitizationService.sanitizeEmail(email);
    } catch {
      res.status(400).send('Invalid email');
      return;
    }

    try {
      await this.subscriptionService.subscribe(sanitized);
      res.status(200).send('Subscribed');
    } catch {
      res.status(500).send('Failed to subscribe');
    }
  }

  @Get('/unsubscribe')
  async unsubscribe(
    @Query('token') token: string,
    @Res() res: FastifyReply,
  ): Promise<void> {
    if (!token) {
      res.status(400).send('No token provided');
      return;
    }

    let sanitized: string;

    try {
      sanitized = this.sanitizationService.sanitizeToken(token);
    } catch {
      res.status(400).send('Invalid token');
      return;
    }

    try {
      const success = await this.subscriptionService.unsubscribe(sanitized);

      if (success) {
        res.status(200).send('Unsubscribed');
      } else {
        res.status(404).send('Token not found');
      }
    } catch {
      res.status(500).send('Failed to unsubscribe');
    }
  }

  @Get('/verify')
  async verify(
    @Query('token') token: string,
    @Res() res: FastifyReply,
  ): Promise<void> {
    if (!token) {
      res.status(400).send('No token provided');
      return;
    }

    let sanitized: string;

    try {
      sanitized = this.sanitizationService.sanitizeToken(token);
    } catch {
      res.status(400).send('Invalid token');
      return;
    }

    try {
      const success = await this.subscriptionService.verify(sanitized);

      if (success) {
        res.status(200).send('Verified');
      } else {
        res.status(404).send('Token not found');
      }
    } catch {
      res.status(500).send('Failed to verify');
    }
  }
}
