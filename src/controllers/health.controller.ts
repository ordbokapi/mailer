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

import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataService } from '../providers';

@Controller('health')
export class HealthController {
  constructor(private readonly dataService: DataService) {}

  @Get()
  async check(): Promise<{ status: string }> {
    if (!(await this.dataService.isHealthy())) {
      throw new ServiceUnavailableException({ status: 'error' });
    }

    return { status: 'ok' };
  }
}
