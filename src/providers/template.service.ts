import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { wrapText } from 'src/utils';

@Injectable()
export class TemplateService {
  #verificationHTMLTemplate = Handlebars.compile(
    readFileSync('templates/verification.hbs', 'utf8'),
  );

  #verificationTextTemplate = Handlebars.compile(
    readFileSync('templates/verification.text.hbs', 'utf8'),
  );

  #signedUpHTMLTemplate = Handlebars.compile(
    readFileSync('templates/signed-up.hbs', 'utf8'),
  );

  #signedUpTextTemplate = Handlebars.compile(
    readFileSync('templates/signed-up.text.hbs', 'utf8'),
  );

  #newPostHTMLTemplate = Handlebars.compile(
    readFileSync('templates/new-post.hbs', 'utf8'),
  );

  #newPostTextTemplate = Handlebars.compile(
    readFileSync('templates/new-post.text.hbs', 'utf8'),
  );

  readonly #textWidth = 80;

  /**
   * Renders the email verification template.
   */
  verification(data: {
    verificationUrl: string;
  }): [html: string, text: string] {
    return [
      this.#verificationHTMLTemplate(data),
      wrapText(this.#verificationTextTemplate(data), this.#textWidth),
    ];
  }

  /**
   * Renders the signed-up template.
   */
  signedUp(data: { unsubscribeUrl: string }): [html: string, text: string] {
    return [
      this.#signedUpHTMLTemplate(data),
      wrapText(this.#signedUpTextTemplate(data), this.#textWidth),
    ];
  }

  /**
   * Renders the new post template.
   */
  newPost(data: {
    title: string;
    url: string;
    summary: string;
    unsubscribeUrl: string;
  }): [html: string, text: string] {
    return [
      this.#newPostHTMLTemplate(data),
      wrapText(this.#newPostTextTemplate(data), this.#textWidth),
    ];
  }
}
