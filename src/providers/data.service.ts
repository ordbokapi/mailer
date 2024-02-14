import { Inject, Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { IAppSecrets } from './i-app-secrets';
import { CryptoService } from './crypto.service';
import * as crypto from 'crypto';

const enum RedisKeys {
  emailQueue = 'emailQueue',
  unsubscribeTokensByEmail = 'unsubscribeTokensByEmail',
  emailByUnsubscribeToken = 'emailByUnsubscribeToken',
  verificationTokensByEmail = 'verificationTokensByEmail',
}

export interface Email {
  template: string;
  subject: string;
  params: Record<string, string>;
}

export interface QueuedEmail extends Email {
  addresses: string[];
}

@Injectable()
export class DataService {
  private readonly client: RedisClientType;

  constructor(
    @Inject('IAppSecrets') private readonly appSecrets: IAppSecrets,
    private readonly cryptoService: CryptoService,
  ) {
    this.client = createClient({
      socket: {
        host: appSecrets.redisHost,
        port: appSecrets.redisPort,
      },
    });

    this.client.connect().catch((err) => {
      console.error('Failed to connect to Redis');
      console.error(err);
    });
  }

  /*
    Keys are stored as such:

    List type for the queue of emails to send, each item is a JSON string:
    `emailQueue`

    Hash, key is the email address, value is the unsubscribe token:
    `unsubscribeTokensByEmail`

    Hash, key is the unsubscribe token, value is the email address:
    `emailByUnsubscribeToken`

    Hash, key is the verification token, value is the email address:
    `verificationTokensByEmail`

    All keys and values are encrypted using the cryptoService.
  */

  async enqueueEmail(email: Email | QueuedEmail, tail = false): Promise<void> {
    const fullEmail: QueuedEmail =
      'addresses' in email
        ? email
        : {
            ...email,
            addresses: await this.getSubscriberAddresses(),
          };

    const serialized = this.cryptoService.encrypt(JSON.stringify(fullEmail));

    if (tail) {
      await this.client.rPush(RedisKeys.emailQueue, serialized);
      return;
    }

    await this.client.lPush(RedisKeys.emailQueue, serialized);
  }

  async dequeueEmail(): Promise<QueuedEmail | undefined> {
    const email = await this.client.lPop(RedisKeys.emailQueue);

    if (email) {
      return JSON.parse(this.cryptoService.decrypt(email));
    }
  }

  /**
   * Subscribes an email for notifications. Generates a unique token and stores
   * it in Redis along with the encrypted email. If the email is already
   * subscribed, returns undefined.
   *
   * @param email The email to subscribe.
   * @returns A unique token if the email is successfully subscribed, otherwise
   * undefined.
   */
  async subscribeEmail(email: string): Promise<string | undefined> {
    const token = crypto.randomBytes(16).toString('hex');

    const existingToken = await this.client.hGet(
      RedisKeys.unsubscribeTokensByEmail,
      this.cryptoService.encrypt(email),
    );

    if (existingToken) {
      return undefined;
    }

    await this.client.hSet(
      RedisKeys.unsubscribeTokensByEmail,
      this.cryptoService.encrypt(email),
      this.cryptoService.encrypt(token),
    );
    await this.client.hSet(
      RedisKeys.emailByUnsubscribeToken,
      this.cryptoService.encrypt(token),
      this.cryptoService.encrypt(email),
    );

    return token;
  }

  /**
   * Unsubscribes an email using the provided token.
   * @param token The token used to identify the email to unsubscribe.
   * @returns A promise that resolves to a boolean indicating whether the email
   * was successfully unsubscribed.
   */
  async unsubscribeEmail(token: string): Promise<boolean> {
    const email = await this.client.hGet(
      RedisKeys.emailByUnsubscribeToken,
      this.cryptoService.encrypt(token),
    );

    if (!email) {
      return false;
    }

    await this.client.hDel(
      RedisKeys.unsubscribeTokensByEmail,
      this.cryptoService.encrypt(this.cryptoService.decrypt(email)),
    );
    await this.client.hDel(RedisKeys.emailByUnsubscribeToken, token);

    return true;
  }

  /**
   * Retrieves all email addresses that are subscribed for notifications, along
   * with their unique unsubscribe tokens.
   * @returns A promise that resolves to a map of email addresses to their
   * unique unsubscribe tokens.
   */
  async getSubscribers(): Promise<Record<string, string>> {
    const encryptedEmails = await this.client.hGetAll(
      RedisKeys.unsubscribeTokensByEmail,
    );

    return Object.fromEntries(
      Object.entries(encryptedEmails).map(([email, token]) => [
        this.cryptoService.decrypt(email),
        this.cryptoService.decrypt(token),
      ]),
    );
  }

  /**
   * Retrieves all email addresses that are subscribed for notifications.
   * @returns A promise that resolves to an array of email addresses.
   */
  async getSubscriberAddresses(): Promise<string[]> {
    const encryptedEmails = await this.client.hKeys(
      RedisKeys.unsubscribeTokensByEmail,
    );

    return encryptedEmails.map((email) => this.cryptoService.decrypt(email));
  }

  /**
   * Retrieves the unique unsubscribe token for the provided email address.
   * @param email The email address to retrieve the token for.
   * @returns A promise that resolves to the unique unsubscribe token for the
   * provided email address, or undefined if the email address is not
   * subscribed.
   */
  async getUnsubscribeToken(email: string): Promise<string | undefined> {
    const token = await this.client.hGet(
      RedisKeys.unsubscribeTokensByEmail,
      this.cryptoService.encrypt(email),
    );

    if (token) {
      return this.cryptoService.decrypt(token);
    }

    return undefined;
  }

  /**
   * Generates a unique verification token and stores it in Redis along with the
   * encrypted email. If the email is already verified, returns undefined. If
   * a verification token already exists for the email, a new one is generated
   * and stored, and the old one is overwritten.
   * @param email The email to create a verification token for.
   * @returns A promise that resolves to the unique verification token if a
   * token was successfully created, otherwise undefined.
   */
  async createVerificationToken(email: string): Promise<string | undefined> {
    if (await this.isEmailVerified(email)) {
      return undefined;
    }

    const token = crypto.randomBytes(16).toString('hex');

    await this.client.hSet(
      RedisKeys.verificationTokensByEmail,
      this.cryptoService.encrypt(email),
      this.cryptoService.encrypt(token),
    );

    return token;
  }

  /**
   * Retrieves the unique verification token for the provided email address.
   * @param email The email address to retrieve the token for.
   * @returns A promise that resolves to the unique verification token for the
   * provided email address, or undefined if the email address is not verified.
   */
  async getVerificationToken(email: string): Promise<string | undefined> {
    const token = await this.client.hGet(
      RedisKeys.verificationTokensByEmail,
      this.cryptoService.encrypt(email),
    );

    if (token) {
      return this.cryptoService.decrypt(token);
    }

    return undefined;
  }

  /**
   * Verifies an email using the provided token.
   * @param token The token used to identify the email to verify.
   * @returns A promise that resolves to a boolean indicating whether the email
   * was successfully verified.
   */
  async verifyEmail(token: string): Promise<boolean> {
    const email = await this.client.hGet(
      RedisKeys.verificationTokensByEmail,
      this.cryptoService.encrypt(token),
    );

    if (!email) {
      return false;
    }

    await this.client.hDel(
      RedisKeys.verificationTokensByEmail,
      this.cryptoService.encrypt(this.cryptoService.decrypt(email)),
    );

    return true;
  }

  /**
   * Checks if the provided email address is verified.
   * @param email The email address to check.
   * @returns A promise that resolves to a boolean indicating whether the email
   * address is verified.
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const token = await this.client.hGet(
      RedisKeys.verificationTokensByEmail,
      this.cryptoService.encrypt(email),
    );

    return !!token;
  }

  /**
   * Closes the connection to the Redis server.
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
}
