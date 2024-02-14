import type { Provider } from '@nestjs/common';
import type { IAppSecrets } from './i-app-secrets';
import { readFileSync } from 'fs';

export function getAppSecretsProvider(): Provider<IAppSecrets> {
  const secrets: Partial<IAppSecrets> = {
    mailHost: process.env.MAIL_HOST,
    mailPort: parseInt(process.env.MAIL_PORT || '0', 10),
    mailSecure: process.env.MAIL_SECURE === 'true',
    mailUser: process.env.MAIL_USER,
    mailPass: process.env.MAIL_PASS,
    mailFrom: process.env.MAIL_FROM,

    recordKey: process.env.RECORD_KEY,
    recordIV: process.env.RECORD_IV,
    recordSalt: process.env.RECORD_SALT,

    redisHost: process.env.REDIS_HOST,
    redisPort: parseInt(process.env.REDIS_PORT || '0', 10),
  };

  try {
    const file = readFileSync('secrets.json', 'utf8');
    const json = JSON.parse(file);

    Object.assign(secrets, json);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  for (const key of Object.keys(secrets) as Array<keyof IAppSecrets>) {
    if (!secrets[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  Object.freeze(secrets);

  for (const key of Object.keys(secrets) as Array<keyof IAppSecrets>) {
    Object.freeze(secrets[key]);
  }

  return {
    provide: 'IAppSecrets',
    useValue: secrets as IAppSecrets,
  };
}
