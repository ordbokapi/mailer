import { Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { DataService } from './data.service';
import { EmailQueueService } from './email-queue.service';

@Injectable()
export class SubscriptionService {
  /**
   * How long verification tokens are valid for, in seconds.
   */
  readonly verificationTokenLifetime = 60 * 30; // 30 minutes

  /**
   * Generates and returns a random token. These tokens are used for
   * unsubscribing from notifications or verifying email addresses.
   */
  #generateToken(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  #logger = new Logger(SubscriptionService.name);

  constructor(
    @Inject(DataService) private readonly dataService: DataService,
    @Inject(EmailQueueService) private readonly emailQueue: EmailQueueService,
  ) {}

  /**
   * Adds a subscriber to the email list. This will send a verification email
   * to the subscriber. Does nothing if the subscriber is already subscribed.
   * @param email The email address to add.
   */
  async subscribe(email: string): Promise<void> {
    if (await this.dataService.isSubscribed(email)) {
      this.#logger.debug(`Already subscribed: ${email}`);
      return;
    }

    const verificationToken = this.#generateToken();

    await this.dataService.addPendingSubscriber(
      { email, verificationToken },
      this.verificationTokenLifetime,
    );

    await this.emailQueue.queueVerificationEmail({
      email,
      token: verificationToken,
    });

    this.#logger.debug(`Subscribed ${email}`);
  }

  /**
   * Verifies a subscriber's email address. This will add the subscriber to the
   * list of verified subscribers.
   * @param verificationToken The verification token to verify.
   * @returns A promise that resolves to a boolean indicating whether the
   * subscriber was successfully verified.
   */
  async verify(verificationToken: string): Promise<boolean> {
    const subscriber =
      await this.dataService.getPendingSubscriber(verificationToken);

    if (!subscriber) {
      this.#logger.debug(
        `Invalid or expired verification token: ${verificationToken}`,
      );
      return false;
    }

    const unsubscribeToken = this.#generateToken();

    await this.dataService.addSubscriber({
      email: subscriber.email,
      unsubscribeToken,
    });
    await this.dataService.removePendingSubscriber(verificationToken);

    await this.emailQueue.queueSignedUpEmail({ email: subscriber.email });

    this.#logger.debug(`Verified ${subscriber.email}`);
    return true;
  }

  /**
   * Unsubscribes a subscriber from the email list.
   * @param unsubscribeToken The unsubscribe token to unsubscribe.
   * @returns A promise that resolves to a boolean indicating whether the
   * subscriber was successfully unsubscribed.
   */
  async unsubscribe(unsubscribeToken: string): Promise<boolean> {
    const result =
      await this.dataService.removeSubscriberByToken(unsubscribeToken);

    if (result) {
      this.#logger.debug(`Unsubscribed ${unsubscribeToken}`);
    } else {
      this.#logger.debug(`Invalid unsubscribe token: ${unsubscribeToken}`);
    }

    return result;
  }
}
