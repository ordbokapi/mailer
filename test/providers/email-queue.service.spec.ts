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

import { describe, it, beforeEach, expect } from 'vitest';
import { vi } from 'vitest';
import { EmailQueueService } from '../../src/providers/email-queue.service';
import { DataService } from '../../src/providers/data.service';
import { AppSecretsService } from '../../src/providers/app-secrets.provider';
import { TemplateName } from '../../src/providers/template.service';

describe('EmailQueueService', () => {
  let service: EmailQueueService;
  let dataService: Partial<DataService>;
  let secrets: Partial<AppSecretsService>;

  beforeEach(() => {
    dataService = { queueEmail: vi.fn().mockResolvedValue(undefined) };

    secrets = {
      frontendUrl: 'https://example.com',
    } as unknown as AppSecretsService;

    service = new EmailQueueService(
      dataService as DataService,
      secrets as AppSecretsService,
    );
  });

  it('should queue verification email', async () => {
    await service.queueVerificationEmail({
      email: 'user@test.com',
      token: 'tok123',
    });

    expect(dataService.queueEmail).toHaveBeenCalledWith({
      addresses: ['user@test.com'],
      params: { verificationUrl: 'https://example.com/verify/?token=tok123' },
      subject: expect.stringContaining('Stadfest'),
      template: TemplateName.Verification,
    });
  });

  it('should queue signed up email', async () => {
    await service.queueSignedUpEmail({ email: 'user@test.com' });

    expect(dataService.queueEmail).toHaveBeenCalledWith({
      addresses: ['user@test.com'],
      params: {},
      subject: expect.stringContaining('Velkomen'),
      template: TemplateName.SignedUp,
      needsUnsubscribeLink: true,
    });
  });

  it('should queue new post email', async () => {
    const params = {
      title: 'Title',
      url: 'https://example.com',
      summary: 'Sum',
      unsubscribeUrl: 'https://example.com/unsub',
    };

    await service.queueNewPostEmail(params);

    expect(dataService.queueEmail).toHaveBeenCalledWith({
      params,
      subject: expect.stringContaining('Nytt innlegg: Title'),
      template: TemplateName.NewPost,
      needsUnsubscribeLink: true,
    });
  });
});
