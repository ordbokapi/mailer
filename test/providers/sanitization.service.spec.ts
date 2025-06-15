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
