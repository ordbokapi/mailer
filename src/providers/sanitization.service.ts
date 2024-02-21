import { Injectable } from '@nestjs/common';
import { URL } from 'url';
import { Address } from 'address-rfc2821';
import { AppSecretsService } from './app-secrets.provider';

/**
 * Options for sanitizing a string.
 */
export interface TextSanitizationOptions {
  /**
   * The maximum length of the string.
   *
   * @default 2048
   */
  maxLength?: number;

  /**
   * What character ranges are allowed in the string. By default, allows all
   * Unicode word characters, whitespace, and standard punctuation.
   *
   * @default /[\p{L}\p{N}\p{M}\p{Pc}\p{Join_C}\s,.\-–—?!:;]+/gu
   */
  allowedCharacters?: RegExp;
}

@Injectable()
export class SanitizationService {
  constructor(private readonly secrets: AppSecretsService) {}

  /**
   * Sanitizes the given e-mail address.
   * @param email The e-mail address to sanitize.
   */
  sanitizeEmail(email: string): string {
    const address = new Address(email.trim().toLowerCase());

    return address.toString();
  }

  /**
   * Sanitizes the given token.
   * @param token The token to sanitize.
   */
  sanitizeToken(token: string): string {
    return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  }

  /**
   * Sanitizes the given blog post URL.
   * @param url The URL to sanitize.
   */
  sanitizeUrl(url: string): string {
    const trimmed = url.slice(0, 2048).trim();

    // make sure url points to the front-end domain
    if (!trimmed.startsWith(this.secrets.frontendUrl)) {
      throw new Error('Invalid URL');
    }

    const parsed = new URL(trimmed);
    const sanitized = new URL(parsed.pathname, this.secrets.frontendUrl);

    return sanitized.toString();
  }

  /**
   * Sanitizes the given text.
   * @param str The text to sanitize.
   * @param options Options for sanitizing the text.
   */
  sanitizeText(str: string, options: TextSanitizationOptions = {}): string {
    const maxLength = options.maxLength ?? 2048;
    const allowedCharacters =
      options.allowedCharacters ??
      /[\p{L}\p{N}\p{M}\p{Pc}\p{Join_C}\s,.\-–—?!:;]+/gu;

    const trimmed = str.trim();
    const sanitized =
      trimmed.slice(0, maxLength).match(allowedCharacters)?.join('') ?? '';

    return sanitized;
  }
}
