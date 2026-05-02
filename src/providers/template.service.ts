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
import Handlebars, { HelperDelegate, HelperOptions } from 'handlebars';
import { readFileSync } from 'fs';
import { kebabify, wrapText } from '../utils';

Handlebars.registerHelper('lfToBr', (text: string) => {
  const parts = text.split('\n');
  const escaped = parts.map((part) => Handlebars.escapeExpression(part));

  return new Handlebars.SafeString(escaped.join('<br />\n'));
});

Handlebars.registerHelper('wrap', (text: string, width: number) => {
  return wrapText(text, width);
});

Handlebars.registerHelper('concat', ((...args: (string | HelperOptions)[]) =>
  args.slice(0, -1).join('')) as HelperDelegate);

/**
 * The names of the available templates.
 */
export enum TemplateName {
  Verification = 'verification',
  SignedUp = 'signedUp',
  NewPost = 'newPost',
}

/**
 * The data that templates need at render time.
 */
export type Templates = {
  [TemplateName.Verification]: { verificationUrl: string };
  [TemplateName.SignedUp]: { unsubscribeUrl: string };
  [TemplateName.NewPost]: {
    title: string;
    url: string;
    summary: string;
    unsubscribeUrl: string;
  };
};

/**
 * The data for a template, i.e. the parameters that the template needs at
 * render time.
 */
export type TemplateData<T extends TemplateName> = Templates[T];

type CompiledHandlebarsTemplate<T extends TemplateName> =
  Handlebars.TemplateDelegate<TemplateData<T>>;

type CompiledTemplates = Record<
  TemplateName,
  {
    text: CompiledHandlebarsTemplate<TemplateName>;
    html: CompiledHandlebarsTemplate<TemplateName>;
  }
>;

/**
 * A service for rendering e-mail templates.
 */
@Injectable()
export class TemplateService {
  #templates = Object.fromEntries(
    Object.values(TemplateName).map((template) => {
      const basename = kebabify(template);
      const html = readFileSync(`templates/${basename}.hbs`, 'utf8');
      const text = readFileSync(`templates/${basename}.text.hbs`, 'utf8');

      return [
        template,
        {
          html: Handlebars.compile(html),
          text: Handlebars.compile(text),
        },
      ];
    }),
  ) as CompiledTemplates;

  /**
   * Renders a template.
   */
  render<T extends TemplateName>(
    template: T,
    data: TemplateData<T>,
  ): [html: string, text: string] {
    return [
      this.#templates[template].html(data),
      this.#templates[template].text(data),
    ];
  }
}
