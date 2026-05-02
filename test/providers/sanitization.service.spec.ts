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
import { SanitizationService } from '../../src/providers/sanitization.service';
import { AppSecretsService } from '../../src/providers/app-secrets.provider';

describe('SanitizationService', () => {
  let service: SanitizationService;

  beforeAll(() => {
    const secrets = {
      frontendUrl: 'https://example.com',
    } as unknown as AppSecretsService;

    service = new SanitizationService(secrets);
  });

  it('should sanitize email addresses', () => {
    const input = ' Foo@Bar.Com ';
    const sanitized = service.sanitizeEmail(input);

    expect(sanitized).toBe('<foo@bar.com>');
  });

  it('should sanitize tokens', () => {
    const input = 'abc123-!@#DEF';
    const sanitized = service.sanitizeToken(input);

    expect(sanitized).toBe('abc123DEF');

    // Max length is 32 characters.
    const long = 'a'.repeat(40);

    expect(service.sanitizeToken(long).length).toBe(32);
  });

  it('should sanitize URLs correctly', () => {
    const valid = 'https://example.com/path/to/resource';
    const sanitized = service.sanitizeUrl(valid);

    expect(sanitized).toBe('https://example.com/path/to/resource');
  });

  it('should reject URLs not starting with frontendUrl', () => {
    expect(() => service.sanitizeUrl('https://malicious.com/')).toThrow();
  });

  it('should sanitize text by allowed characters and max length', () => {
    const input = 'Hello!!! $$$ 😊 world';
    const sanitized = service.sanitizeText(input, { maxLength: 10 });

    expect(sanitized).toBe('Hello!!!');
  });
});
