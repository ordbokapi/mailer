import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { envify } from '../utils';

const getEnv = (
  key: keyof AppSecretsService,
  fallback?: string,
): string | undefined => process.env[envify(key)] || fallback;

const getEnvBool = (
  key: keyof AppSecretsService,
  fallback?: boolean,
): boolean | undefined => {
  const value = getEnv(key);
  return value === undefined ? fallback : value === 'true';
};

const getEnvInt = (
  key: keyof AppSecretsService,
  fallback?: number,
): number | undefined => {
  const value = getEnv(key);
  return value === undefined ? fallback : parseInt(value, 10);
};

@Injectable()
export class AppSecretsService {
  public readonly apiKey: string;

  public readonly mailHost: string;
  public readonly mailPort: number;
  public readonly mailRequireTLS: boolean;
  public readonly mailSecure: boolean;
  public readonly mailUser: string;
  public readonly mailPass: string;
  public readonly mailFrom: string;
  public readonly mailAcceptUnauthorized: boolean;

  public readonly recordKey: string;
  public readonly recordIV: string;
  public readonly recordSalt: string;

  public readonly redisUrl: string;

  public readonly baseUrl: string;
  public readonly frontendUrl: string;

  constructor() {
    const secrets: Partial<AppSecretsService> = {
      apiKey: getEnv('apiKey'),

      mailHost: getEnv('mailHost'),
      mailPort: getEnvInt('mailPort'),
      mailRequireTLS: getEnvBool('mailRequireTLS', true),
      mailSecure: getEnvBool('mailSecure', true),
      mailUser: getEnv('mailUser'),
      mailPass: getEnv('mailPass'),
      mailFrom: getEnv('mailFrom'),
      mailAcceptUnauthorized: getEnvBool('mailAcceptUnauthorized', false),

      recordKey: getEnv('recordKey'),
      recordIV: getEnv('recordIV'),
      recordSalt: getEnv('recordSalt'),

      redisUrl: getEnv('redisUrl', process.env.REDISCLOUD_URL),

      baseUrl: getEnv('baseUrl'),
      frontendUrl: getEnv('frontendUrl'),
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

    for (const key of Object.keys(secrets) as Array<keyof AppSecretsService>) {
      if (secrets[key] === undefined) {
        throw new Error(`Missing environment variable: ${key}`);
      }

      this[key as keyof this] = secrets[key] as any;

      Object.freeze(this[key]);
    }

    Object.freeze(this);
  }
}
