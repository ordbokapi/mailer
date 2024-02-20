import { Injectable } from '@nestjs/common';
import { Address } from 'address-rfc2821';

@Injectable()
export class SanitizationService {
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
}
