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
