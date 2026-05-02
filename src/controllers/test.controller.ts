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

import { Controller, Get } from '@nestjs/common';
import { AppSecretsService, EmailQueueService } from '../providers';
import { DevOnly, pickRandom } from '../utils';

@Controller()
@DevOnly()
export class TestController {
  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly secrets: AppSecretsService,
  ) {}

  @Get('/test/new-post')
  async newPost(): Promise<string> {
    await this.emailQueue.queueNewPostEmail({
      title: pickRandom([
        'Duis aute irure dolor in reprehen-derit',
        'Excepteur sint occaeca-tcupidatat non proident',
        'Lorem ipsum dolor sit amet, consectetur adipisici-elite',
      ]),
      url: pickRandom([
        `${this.secrets.frontendUrl}/post/62438/lorem-ipsum`,
        `${this.secrets.frontendUrl}/post/71702/excepteur-sint`,
        `${this.secrets.frontendUrl}/post/81920/duis-aute-irure`,
      ]),
      summary: pickRandom([
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      ]),
    });

    return 'Email queued';
  }
}
