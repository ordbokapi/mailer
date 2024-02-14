import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { IAppSecrets } from './i-app-secrets';

@Injectable()
export class CryptoService {
  constructor(@Inject('IAppSecrets') private readonly secrets: IAppSecrets) {}

  encrypt(data: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.secrets.recordKey, 'hex'),
      Buffer.from(this.secrets.recordIV, 'hex'),
    );

    let encrypted = cipher.update(this.secrets.recordSalt + data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return encrypted.toString('hex');
  }

  decrypt(data: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.secrets.recordKey, 'hex'),
      Buffer.from(this.secrets.recordIV, 'hex'),
    );

    let decrypted = decipher.update(Buffer.from(data, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString().slice(this.secrets.recordSalt.length);
  }
}
