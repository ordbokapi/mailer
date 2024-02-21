import { Injectable, LogLevel, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { AppSecretsService } from '../../providers';
import { WorkerExitCodes } from '../worker-exit-codes';
import { format } from 'util';

@Injectable()
export class MailService {
  #transporter: nodemailer.Transporter;
  #logger: Logger = new Logger(MailService.name);

  constructor(private readonly secrets: AppSecretsService) {
    const mailerLogger = new Logger('nodemailer');

    const logger =
      (LogLevel: LogLevel) =>
      (obj: unknown, message: string, ...args: unknown[]) => {
        mailerLogger.verbose(obj);
        mailerLogger[LogLevel](format(message, ...args));
      };

    const options: SMTPTransport.Options = {
      host: this.secrets.mailHost,
      port: this.secrets.mailPort,
      secure: this.secrets.mailSecure,
      requireTLS: this.secrets.mailRequireTLS,
      auth: {
        user: this.secrets.mailUser,
        pass: this.secrets.mailPass,
      },
      tls: {
        rejectUnauthorized: !this.secrets.mailAcceptUnauthorized,
      },
      logger: {
        level() {},
        trace: logger('verbose'),
        debug: logger('debug'),
        // the info logs from nodemailer are not so important so debug it is
        info: logger('debug'),
        warn: logger('warn'),
        error: logger('error'),
        fatal: logger('fatal'),
      },
    };

    this.#transporter = nodemailer.createTransport(options);
  }

  async onApplicationBootstrap() {
    try {
      await this.#transporter.verify();
      this.#logger.log('Mail transporter verified');
    } catch (error) {
      this.#logger.fatal('Failed to verify mail transporter');
      this.#logger.fatal(error);
      setTimeout(() => process.exit(WorkerExitCodes.MailTransportError), 1000);
    }
  }

  async sendMail({
    to,
    subject,
    text,
    html,
    autoUnsubscribeUrl,
  }: {
    to: string;
    subject: string;
    text: string;
    html: string;
    autoUnsubscribeUrl?: string;
  }) {
    // autoUnsubscribeUrl is a URL that the recipient can use to unsubscribe
    // from the mailing list automatically without user interaction. This is
    // used in the email List-Unsubscribe header.

    await this.#transporter.sendMail({
      from: this.secrets.mailFrom,
      to,
      subject,
      text,
      html,
      ...(autoUnsubscribeUrl
        ? {
            headers: {
              'List-Unsubscribe': `<${autoUnsubscribeUrl}>`,
            },
          }
        : {}),
    });
  }
}
