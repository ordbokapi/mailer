import { Injectable, Logger, Optional } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { CryptoService } from './crypto.service';
import { AppSecretsService } from './app-secrets.provider';
import { TemplateName, TemplateData } from './template.service';

const enum RedisKeys {
  emailQueue = 'emailQueue',
  unsubscribeTokensByEmail = 'unsubscribeTokensByEmail',
  emailByUnsubscribeToken = 'emailByUnsubscribeToken',
}

/**
 * The parameters for an email template as they are stored in Redis. The
 * `unsubscribeUrl` parameter is not stored in Redis, as it is generated at
 * render time.
 */
export type TemplateParams<T extends TemplateName> = Omit<
  TemplateData<T>,
  'unsubscribeUrl'
>;

export interface Email<T extends TemplateName> {
  template: T;
  subject: string;
  params: TemplateParams<T>;
  needsUnsubscribeLink?: boolean;
}

export interface QueuedEmail<T extends TemplateName> extends Email<T> {
  addresses: string[];
}

export interface Subscriber {
  email: string;
  unsubscribeToken: string;
}

export interface PendingSubscriber {
  email: string;
  verificationToken: string;
}

@Injectable()
export class DataService {
  private readonly client: RedisClientType;
  readonly #logger = new Logger(DataService.name);

  constructor(
    appSecrets: AppSecretsService,
    private readonly cryptoService: CryptoService,
    @Optional() client?: RedisClientType,
  ) {
    if (client) {
      this.client = client;
    } else {
      this.client = createClient({ url: appSecrets.redisUrl });
      this.client
        .connect()
        .then(() => {
          // log errors
          this.client.on('error', (err) => {
            this.#logger.error(`Redis error: ${err?.message || err?.code}`);
          });
        })
        .catch((err) => {
          this.#logger.fatal(
            `Failed to connect to Redis: ${err?.message || err?.code}`,
          );
          setTimeout(() => process.exit(1), 1000);
        });

      // log reconnections
      this.client.on('reconnecting', () => {
        this.#logger.debug('Reconnecting to Redis...');
      });

      // log successful connections
      this.client.on('connect', () => {
        this.#logger.log('Connected to Redis');
      });
    }
  }

  /*
    Keys are stored as such:

    List type for the queue of emails to send, each item is a JSON string:
    `emailQueue`

    Hash, key is the email address, value is the unsubscribe token:
    `unsubscribeTokensByEmail`

    Hash, key is the unsubscribe token, value is the email address:
    `emailByUnsubscribeToken`

    String key, name is the verification token, value is the email address:
    `verify_${token}` (expires after a set time period)

    All keys and values are encrypted using the cryptoService.
  */

  /**
   * Adds a subscriber to Redis.
   * @param subscriber The subscriber to add.
   */
  async addSubscriber(subscriber: Subscriber): Promise<void> {
    const { email, unsubscribeToken } = subscriber;

    await this.client.hSet(
      RedisKeys.unsubscribeTokensByEmail,
      this.cryptoService.encrypt(email),
      this.cryptoService.encrypt(unsubscribeToken),
    );
    await this.client.hSet(
      RedisKeys.emailByUnsubscribeToken,
      this.cryptoService.encrypt(unsubscribeToken),
      this.cryptoService.encrypt(email),
    );
  }

  /**
   * Retrieves all subscribers from Redis.
   * @returns A promise that resolves to an array of subscribers.
   */
  async getSubscribers(): Promise<Subscriber[]> {
    const encryptedSubscribers = await this.client.hGetAll(
      RedisKeys.unsubscribeTokensByEmail,
    );

    return Object.entries(encryptedSubscribers).map(
      ([email, unsubscribeToken]) => ({
        email: this.cryptoService.decrypt(email),
        unsubscribeToken: this.cryptoService.decrypt(unsubscribeToken),
      }),
    );
  }

  /**
   * Removes a subscriber from Redis.
   * @param email The email address of the subscriber to remove.
   * @returns A promise that resolves to a boolean indicating whether the
   * subscriber was successfully removed.
   */
  async removeSubscriber(email: string): Promise<boolean> {
    const count = await this.client.hDel(
      RedisKeys.unsubscribeTokensByEmail,
      this.cryptoService.encrypt(email),
    );

    if (count === 0) {
      return false;
    }

    await this.client.hDel(
      RedisKeys.emailByUnsubscribeToken,
      this.cryptoService.encrypt(email),
    );
    return true;
  }

  /**
   * Removes a subscriber from Redis using their unsubscribe token.
   * @param unsubscribeToken The unsubscribe token of the subscriber to remove.
   * @returns A promise that resolves to a boolean indicating whether the
   * subscriber was successfully removed.
   */
  async removeSubscriberByToken(unsubscribeToken: string): Promise<boolean> {
    const encryptedEmail = await this.client.hGet(
      RedisKeys.emailByUnsubscribeToken,
      this.cryptoService.encrypt(unsubscribeToken),
    );

    if (!encryptedEmail) {
      return false;
    }

    await this.client.hDel(RedisKeys.unsubscribeTokensByEmail, encryptedEmail);
    await this.client.hDel(
      RedisKeys.emailByUnsubscribeToken,
      this.cryptoService.encrypt(unsubscribeToken),
    );
    return true;
  }

  /**
   * Checks if a subscriber is subscribed.
   * @param email The email address of the subscriber to check.
   * @returns A promise that resolves to a boolean indicating whether the
   * subscriber is subscribed.
   */
  async isSubscribed(email: string): Promise<boolean> {
    return await this.client.hExists(
      RedisKeys.unsubscribeTokensByEmail,
      this.cryptoService.encrypt(email),
    );
  }

  /**
   * Adds a pending subscriber to Redis. Pending subscribers are those who have
   * signed up but have not yet verified their email address.
   * @param pendingSubscriber The pending subscriber to add.
   * @param expireAfter The time in seconds after which the verification token
   * should expire.
   */
  async addPendingSubscriber(
    pendingSubscriber: PendingSubscriber,
    expireAfter: number,
  ): Promise<void> {
    const { email, verificationToken } = pendingSubscriber;

    await this.client.set(
      `verify_${this.cryptoService.encrypt(verificationToken)}`,
      this.cryptoService.encrypt(email),
      { EX: expireAfter },
    );
  }

  /**
   * Retrieves a pending subscriber from Redis.
   * @param verificationToken The verification token of the pending subscriber
   * to retrieve.
   * @returns A promise that resolves to the pending subscriber, or null if the
   * verification token is invalid or has expired.
   */
  async getPendingSubscriber(
    verificationToken: string,
  ): Promise<PendingSubscriber | null> {
    const email = await this.client.get(
      `verify_${this.cryptoService.encrypt(verificationToken)}`,
    );

    if (!email) {
      return null;
    }

    return { email: this.cryptoService.decrypt(email), verificationToken };
  }

  /**
   * Removes a pending subscriber from Redis.
   * @param verificationToken The verification token of the pending subscriber
   * to remove.
   * @returns A promise that resolves to a boolean indicating whether the
   * pending subscriber was successfully removed.
   */
  async removePendingSubscriber(verificationToken: string): Promise<boolean> {
    const count = await this.client.del(
      `verify_${this.cryptoService.encrypt(verificationToken)}`,
    );

    return count > 0;
  }

  /**
   * Adds an email to the queue of emails to send. The email is added to the
   * back of the queue.
   * @param email The email to add to the queue.
   */
  async queueEmail<T extends TemplateName>(
    email: QueuedEmail<T> | Email<T>,
  ): Promise<void> {
    const queuedEmail: QueuedEmail<T> =
      'addresses' in email
        ? email
        : {
            ...email,
            addresses: await this.getSubscribers().then((subscribers) =>
              subscribers.map((s) => s.email),
            ),
          };

    await this.client.rPush(
      RedisKeys.emailQueue,
      this.cryptoService.encrypt(JSON.stringify(queuedEmail)),
    );
  }

  /**
   * Retrieves an email from the front of the queue of emails to send.
   * @returns A promise that resolves to the email at the front of the queue, or
   * null if the queue is empty.
   */
  async dequeueEmail(): Promise<QueuedEmail<TemplateName> | null> {
    const encryptedEmail = await this.client.lPop(RedisKeys.emailQueue);

    if (!encryptedEmail) {
      return null;
    }

    return JSON.parse(this.cryptoService.decrypt(encryptedEmail));
  }

  /**
   * Retrieves the unsubscribe tokens for multiple subscribers.
   * @param emails The email addresses of the subscribers to retrieve the
   * unsubscribe tokens for.
   * @returns A promise that resolves to an array of unsubscribe tokens. If a
   * subscriber is not subscribed, the corresponding array element will be null.
   */
  async getUnsubscribeTokens(emails: string[]): Promise<(string | null)[]> {
    const encryptedTokens = await this.client.hmGet(
      RedisKeys.unsubscribeTokensByEmail,
      emails.map((email) => this.cryptoService.encrypt(email)),
    );

    return encryptedTokens.map((encryptedToken) =>
      encryptedToken ? this.cryptoService.decrypt(encryptedToken) : null,
    );
  }

  /**
   * Closes the connection to the Redis server.
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
}
