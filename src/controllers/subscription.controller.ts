// SPDX-FileCopyrightText: Copyright (C) 2024 Adaline Simonian
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// This file is part of Ordbok API.
//
// Ordbok API is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.
//
// Ordbok API is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
// details.
//
// You should have received a copy of the GNU Affero General Public License
// along with Ordbok API. If not, see <https://www.gnu.org/licenses/>.

import { Controller, Get, Query, Res } from '@nestjs/common';
import { Throttle, seconds } from '@nestjs/throttler';
import { FastifyReply } from 'fastify';
import { SubscriptionService, SanitizationService } from '../providers';

@Controller()
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly sanitizationService: SanitizationService,
  ) {}

  @Get('/subscribe')
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
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
