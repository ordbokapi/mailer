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
import { vi, type Mock } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ApiModule } from '../../src/api/api.module';
import { SubscriptionService } from '../../src/providers/subscription.service';
import { SanitizationService } from '../../src/providers/sanitization.service';
import { ThrottlerBehindProxyGuard } from '../../src/api/throttler-behind-proxy.guard';

describe('SubscriptionController (e2e)', () => {
  let app: NestFastifyApplication;
  let subscriptionService: Partial<SubscriptionService>;
  let sanitizationService: Partial<SanitizationService>;

  beforeAll(async () => {
    subscriptionService = {
      subscribe: vi.fn().mockResolvedValue(undefined),
      verify: vi.fn().mockResolvedValue(true),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };
    sanitizationService = {
      sanitizeEmail: vi.fn((s: string) => {
        if (s === 'bad') {
          throw new Error();
        }

        return s;
      }),
      sanitizeToken: vi.fn((s: string) => {
        if (s === 'bad') {
          throw new Error();
        }

        return s;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiModule],
    })
      .overrideProvider(SubscriptionService)
      .useValue(subscriptionService)
      .overrideProvider(SanitizationService)
      .useValue(sanitizationService)
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

  describe('/subscribe (GET)', () => {
    it('should return 400 if no email', () =>
      request(app.getHttpServer())
        .get('/subscribe')
        .expect(HttpStatus.BAD_REQUEST));

    it('should return 400 if invalid email', () =>
      request(app.getHttpServer())
        .get('/subscribe')
        .query({ email: 'bad' })
        .expect(HttpStatus.BAD_REQUEST));

    it('should subscribe successfully', () =>
      request(app.getHttpServer())
        .get('/subscribe')
        .query({ email: 'good@example.com' })
        .expect(HttpStatus.OK)
        .expect('Subscribed'));

    it('should handle service errors', () => {
      (subscriptionService.subscribe as Mock).mockRejectedValueOnce(
        new Error(),
      );
      return request(app.getHttpServer())
        .get('/subscribe')
        .query({ email: 'good2@example.com' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/verify (GET)', () => {
    it('should return 400 if no token', () =>
      request(app.getHttpServer())
        .get('/verify')
        .expect(HttpStatus.BAD_REQUEST));

    it('should return 400 if invalid token', () =>
      request(app.getHttpServer())
        .get('/verify')
        .query({ token: 'bad' })
        .expect(HttpStatus.BAD_REQUEST));

    it('should verify successfully', () =>
      request(app.getHttpServer())
        .get('/verify')
        .query({ token: 'tok123' })
        .expect(HttpStatus.OK)
        .expect('Verified'));

    it('should return 404 if not found', () => {
      (subscriptionService.verify as Mock).mockResolvedValueOnce(false);
      return request(app.getHttpServer())
        .get('/verify')
        .query({ token: 'tok404' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle service errors', () => {
      (subscriptionService.verify as Mock).mockRejectedValueOnce(new Error());
      return request(app.getHttpServer())
        .get('/verify')
        .query({ token: 'tokerr' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/unsubscribe (GET)', () => {
    it('should return 400 if no token', () =>
      request(app.getHttpServer())
        .get('/unsubscribe')
        .expect(HttpStatus.BAD_REQUEST));

    it('should return 400 if invalid token', () =>
      request(app.getHttpServer())
        .get('/unsubscribe')
        .query({ token: 'bad' })
        .expect(HttpStatus.BAD_REQUEST));

    it('should unsubscribe successfully', () =>
      request(app.getHttpServer())
        .get('/unsubscribe')
        .query({ token: 'tokU' })
        .expect(HttpStatus.OK)
        .expect('Unsubscribed'));

    it('should return 404 if not found', () => {
      (subscriptionService.unsubscribe as Mock).mockResolvedValueOnce(false);
      return request(app.getHttpServer())
        .get('/unsubscribe')
        .query({ token: 'tok404' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle service errors', () => {
      (subscriptionService.unsubscribe as Mock).mockRejectedValueOnce(
        new Error(),
      );
      return request(app.getHttpServer())
        .get('/unsubscribe')
        .query({ token: 'tokerr' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
