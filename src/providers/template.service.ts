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

export enum Template {
  Verification = 'verification',
  SignedUp = 'signedUp',
  NewPost = 'newPost',
}

export type Templates = {
  [Template.Verification]: { verificationUrl: string };
  [Template.SignedUp]: { unsubscribeUrl: string };
  [Template.NewPost]: {
    title: string;
    url: string;
    summary: string;
    unsubscribeUrl: string;
  };
};

@Injectable()
export class TemplateService {
  #templates = Object.fromEntries(
    Object.values(Template).map((template) => {
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
  ) as Record<
    keyof Templates,
    {
      text: Handlebars.TemplateDelegate<Templates[keyof Templates]>;
      html: Handlebars.TemplateDelegate<Templates[keyof Templates]>;
    }
  >;

  /**
   * Renders a template.
   */
  render<T extends keyof Templates>(
    template: T,
    data: Templates[T],
  ): [html: string, text: string] {
    return [
      this.#templates[template].html(data),
      this.#templates[template].text(data),
    ];
  }
}
