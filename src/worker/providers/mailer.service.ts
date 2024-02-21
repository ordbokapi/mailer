import { Inject, Injectable, Logger } from '@nestjs/common';
import { runAllMaxConcurrency, ConcurrencyError } from '../../utils';
import {
  TemplateService,
  DataService,
  QueuedEmail,
  TemplateName,
} from '../../providers';
import { MailService } from './mail.service';

@Injectable()
export class MailerService {
  constructor(
    @Inject(MailService) private readonly mailService: MailService,
    @Inject(TemplateService) private readonly templateService: TemplateService,
    @Inject(DataService) private readonly dataService: DataService,
  ) {}

  #logger = new Logger(MailerService.name);
  #intervalId: NodeJS.Timeout;
  #pollFrequency = 5000;
  #stopped = true;
  #currentPoll: Promise<void> | undefined;

  /**
   * Starts the mailer service.
   */
  start(): void {
    if (!this.#stopped) {
      return;
    }

    this.#logger.log('Starting mailer service');
    this.#stopped = false;
    this.#queueNextPoll();
  }

  /**
   * Runs when the application is starting up.
   */
  onApplicationBootstrap(): void {
    this.start();
  }

  /**
   * Stops the mailer service.
   */
  stop(): void {
    if (this.#stopped) {
      return;
    }

    this.#stopped = true;
    clearTimeout(this.#intervalId);
  }

  /**
   * Queues the next poll unless the service has been stopped.
   */
  #queueNextPoll(): void {
    if (this.#stopped) {
      return;
    }

    this.#intervalId = setTimeout(this.#poll.bind(this), this.#pollFrequency);
  }

  /**
   * Polls for emails to send.
   */
  async #poll(): Promise<void> {
    this.#logger.verbose('Polling for emails');

    try {
      const email = await this.dataService.dequeueEmail();

      if (email) {
        this.#currentPoll = this.sendEmail(email);
        await this.#currentPoll;
      }
    } catch (error) {
      this.#logger.error('An error occurred while polling for emails', error);
    } finally {
      this.#queueNextPoll();
    }
  }

  /**
   * Sends an email.
   * @param email The email to send.
   */
  async sendEmail(email: QueuedEmail<TemplateName>): Promise<void> {
    const succeeded: string[] = [];
    try {
      const { addresses, template, subject, params, needsUnsubscribeLink } =
        email;

      let addressesWithTokens: [string, string | undefined][];

      if (needsUnsubscribeLink) {
        const unsubscribeTokens =
          await this.dataService.getUnsubscribeTokens(addresses);

        addressesWithTokens = addresses
          .map((address, index) => [address, unsubscribeTokens[index]])
          .filter(([, token]) => token) as [string, string][];
      } else {
        addressesWithTokens = addresses.map((address) => [address, undefined]);
      }

      await runAllMaxConcurrency(
        async (email, unsubscribeToken) => {
          if (needsUnsubscribeLink && !unsubscribeToken) {
            this.#logger.error(
              `Failed to get unsubscribe token for email ${email}`,
            );
            return;
          }

          const [html, text] = this.templateService.render(
            template,
            (needsUnsubscribeLink
              ? {
                  ...params,
                  unsubscribeUrl: `https://blog.ordbokapi.org/unsubscribe?token=${unsubscribeToken}`,
                }
              : params) as any,
          );

          try {
            await this.mailService.sendMail({
              to: email,
              subject,
              text,
              html,
              autoUnsubscribeUrl: needsUnsubscribeLink
                ? `https://blog-api.ordbokapi.org/unsubscribe?token=${unsubscribeToken}`
                : undefined,
            });

            this.#logger.debug(`Sent email to ${email}`);
          } catch (error) {
            this.#logger.error(`Failed to send email to ${email}`, error);
            console.error(error);
          }

          succeeded.push(email);
        },
        addressesWithTokens,
        5,
      );
    } catch (err) {
      this.#logger.error('Failed to send emails', err);
      console.error(err);

      if (err instanceof ConcurrencyError) {
        this.#logger.error(err.errors);
        console.error(err.errors);
      }

      // Re-enqueue the email at the end of the queue with only the addresses
      // that failed to receive the email
      await this.dataService.queueEmail({
        ...email,
        addresses: email.addresses.filter(
          (address) => !succeeded.includes(address),
        ),
      });
    }
  }

  /**
   * Runs when the application is shutting down.
   */
  async beforeApplicationShutdown(): Promise<void> {
    this.stop();

    // Wait for the current poll to finish before stopping the service
    await this.#currentPoll;
  }
}
