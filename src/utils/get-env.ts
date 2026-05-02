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

import { readFileSync } from 'fs';
import { envify } from './envify';

export function getEnv(key: string, fallback?: string): string | undefined {
  return process.env[envify(key)] || fallback;
}

export function getEnvBool(
  key: string,
  fallback?: boolean,
): boolean | undefined {
  const value = getEnv(key);
  return value === undefined ? fallback : value === 'true';
}

export function getEnvInt(key: string, fallback?: number): number | undefined {
  const value = getEnv(key);
  return value === undefined ? fallback : parseInt(value, 10);
}

/**
 * Load environment variables and assign them to the given object.
 */
export function loadSecrets(
  target: object,
  secrets: Record<string, unknown>,
): void {
  try {
    const file = readFileSync('secrets.json', 'utf8');
    const json = JSON.parse(file);

    for (const key of Object.keys(secrets)) {
      if (key in json) {
        (secrets as Record<string, unknown>)[key] = json[key];
      }
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code !== 'ENOENT'
    ) {
      throw error;
    }
  }

  for (const key of Object.keys(secrets)) {
    if (secrets[key] === undefined) {
      throw new Error(`Missing environment variable: ${key}`);
    }

    (target as Record<string, unknown>)[key] = secrets[key];
    Object.freeze((target as Record<string, unknown>)[key]);
  }

  Object.freeze(target);
}
