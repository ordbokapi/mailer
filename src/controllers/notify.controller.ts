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

import {
  Body,
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
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
    if (
      !authorization ||
      authorization.length !== this.secrets.apiKey.length ||
      !crypto.timingSafeEqual(
        Buffer.from(authorization),
        Buffer.from(this.secrets.apiKey),
      )
    ) {
      throw new UnauthorizedException();
    }

    await this.emailQueue.queueNewPostEmail({
      title: this.sanitizer.sanitizeText(title, { maxLength: 100 }),
      url: this.sanitizer.sanitizeUrl(url),
      summary: this.sanitizer.sanitizeText(summary),
    });
  }
}
