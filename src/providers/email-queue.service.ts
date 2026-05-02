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

import { Injectable } from '@nestjs/common';
import { DataService, TemplateParams } from './data.service';
import { TemplateName } from './template.service';
import { AppSecretsService } from './app-secrets.provider';

@Injectable()
export class EmailQueueService {
  constructor(
    private readonly data: DataService,
    private readonly secrets: AppSecretsService,
  ) {}

  async queueVerificationEmail(data: {
    email: string;
    token: string;
  }): Promise<void> {
    await this.data.queueEmail({
      addresses: [data.email],
      params: {
        verificationUrl: `${this.secrets.frontendUrl}/verify/?token=${data.token}`,
      },
      subject: 'Ordbok API Utviklingsblogg: Stadfest e-postadressa di',
      template: TemplateName.Verification,
    });
  }

  async queueSignedUpEmail(data: { email: string }): Promise<void> {
    await this.data.queueEmail({
      addresses: [data.email],
      params: {},
      subject: 'Ordbok API Utviklingsblogg: Velkomen!',
      template: TemplateName.SignedUp,
      needsUnsubscribeLink: true,
    });
  }

  async queueNewPostEmail(
    data: TemplateParams<TemplateName.NewPost>,
  ): Promise<void> {
    await this.data.queueEmail({
      params: data,
      subject: `Ordbok API Utviklingsblogg: Nytt innlegg: ${data.title}`,
      template: TemplateName.NewPost,
      needsUnsubscribeLink: true,
    });
  }
}
