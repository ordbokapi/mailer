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
import { getEnv, getEnvBool, getEnvInt, loadSecrets } from '../../utils';

@Injectable()
export class MailSecretsService {
  public readonly mailHost!: string;
  public readonly mailPort!: number;
  public readonly mailRequireTLS!: boolean;
  public readonly mailSecure!: boolean;
  public readonly mailUser!: string;
  public readonly mailPass!: string;
  public readonly mailFrom!: string;
  public readonly mailAcceptUnauthorized!: boolean;

  constructor() {
    loadSecrets(this, {
      mailHost: getEnv('mailHost'),
      mailPort: getEnvInt('mailPort'),
      mailRequireTLS: getEnvBool('mailRequireTLS', true),
      mailSecure: getEnvBool('mailSecure', true),
      mailUser: getEnv('mailUser'),
      mailPass: getEnv('mailPass'),
      mailFrom: getEnv('mailFrom'),
      mailAcceptUnauthorized: getEnvBool('mailAcceptUnauthorized', false),
    });
  }
}
