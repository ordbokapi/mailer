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

import { describe, it, beforeAll, expect } from 'vitest';
import { CryptoService } from '../../src/providers/crypto.service';
import { AppSecretsService } from '../../src/providers/app-secrets.provider';

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  let secrets: Partial<AppSecretsService>;

  beforeAll(() => {
    // Use deterministic key, iv, and salt.
    secrets = {
      recordKey: Buffer.alloc(32, 0).toString('hex'),
      recordIV: Buffer.alloc(16, 0).toString('hex'),
      recordSalt: 'salt',
    };
    cryptoService = new CryptoService(secrets as AppSecretsService);
  });

  it('should encrypt and decrypt data correctly', () => {
    const original = 'my-secret-data';
    const encrypted = cryptoService.encrypt(original);
    expect(typeof encrypted).toBe('string');
    const decrypted = cryptoService.decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different outputs for different inputs', () => {
    const a = cryptoService.encrypt('foo');
    const b = cryptoService.encrypt('bar');
    expect(a).not.toBe(b);
  });
});
