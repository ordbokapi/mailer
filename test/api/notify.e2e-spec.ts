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

import { describe, it, beforeAll, afterAll } from 'vitest';
import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ThrottlerBehindProxyGuard } from '../../src/api/throttler-behind-proxy.guard';
import { ApiModule } from '../../src/api/api.module';
import { EmailQueueService } from '../../src/providers/email-queue.service';
import { SanitizationService } from '../../src/providers/sanitization.service';
import { AppSecretsService } from '../../src/providers/app-secrets.provider';

describe('NotifyController (e2e)', () => {
  let app: NestFastifyApplication;
  let emailQueueService: Partial<EmailQueueService>;

  const apiKey = 'test-api-key-1234';

  beforeAll(async () => {
    emailQueueService = {
      queueNewPostEmail: vi.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiModule],
    })
      .overrideProvider(EmailQueueService)
      .useValue(emailQueueService)
      .overrideProvider(SanitizationService)
      .useValue({
        sanitizeText: vi.fn((s: string) => s),
        sanitizeUrl: vi.fn((s: string) => s),
      })
      .overrideProvider(AppSecretsService)
      .useValue({ apiKey, frontendUrl: 'https://blog.ordbokapi.org' })
      .overrideGuard(ThrottlerBehindProxyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/new-post (POST)', () => {
    it('should return 401 without authorization', () =>
      request(app.getHttpServer())
        .post('/new-post')
        .send({ title: 'Test', url: 'https://example.com', summary: 'Sum' })
        .expect(HttpStatus.UNAUTHORIZED));

    it('should return 401 with wrong key', () =>
      request(app.getHttpServer())
        .post('/new-post')
        .set('Authorization', 'wrong-key')
        .send({ title: 'Test', url: 'https://example.com', summary: 'Sum' })
        .expect(HttpStatus.UNAUTHORIZED));

    it('should return 401 with key of different length', () =>
      request(app.getHttpServer())
        .post('/new-post')
        .set('Authorization', 'short')
        .send({ title: 'Test', url: 'https://example.com', summary: 'Sum' })
        .expect(HttpStatus.UNAUTHORIZED));

    it('should accept with correct key', () =>
      request(app.getHttpServer())
        .post('/new-post')
        .set('Authorization', apiKey)
        .send({ title: 'Test', url: 'https://example.com', summary: 'Sum' })
        .expect(HttpStatus.ACCEPTED));
  });
});
