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
import {
  TemplateService,
  TemplateName,
} from '../../src/providers/template.service';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeAll(() => {
    service = new TemplateService();
  });

  it('should render verification template', () => {
    const [html, text] = service.render(TemplateName.Verification, {
      verificationUrl: 'https://example.com/verify',
    });

    expect(html).toContain('https://example.com/verify');
    expect(text).toContain('https://example.com/verify');
  });

  it('should render signed up template', () => {
    const [html, text] = service.render(TemplateName.SignedUp, {
      unsubscribeUrl: 'https://example.com/unsub',
    });

    expect(html).toContain('https://example.com/unsub');
    expect(text).toContain('https://example.com/unsub');
  });

  it('should render new post template', () => {
    const data = {
      title: 'Title',
      url: 'https://example.com',
      summary: 'Summary',
      unsubscribeUrl: 'https://example.com/unsub',
    };
    const [html, text] = service.render(TemplateName.NewPost, data);

    expect(html).toContain(data.title);
    expect(html).toContain(data.url);
    expect(html).toContain(data.summary);
    expect(text).toContain(data.title);
    expect(text).toContain(data.url);
    expect(text).toContain(data.summary);
  });
});
