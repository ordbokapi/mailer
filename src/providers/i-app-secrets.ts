export interface IAppSecrets {
  mailHost: string;
  mailPort: number;
  mailSecure: boolean;
  mailUser: string;
  mailPass: string;
  mailFrom: string;

  recordKey: string;
  recordIV: string;
  recordSalt: string;

  redisHost: string;
  redisPort: number;
}
