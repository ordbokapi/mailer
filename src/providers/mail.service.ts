import { Injectable, Inject } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { IAppSecrets } from './i-app-secrets';

@Injectable()
export class MailService {
  constructor(@Inject('IAppSecrets') private readonly secrets: IAppSecrets) {}

  async sendMail({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }) {
    const transporter = nodemailer.createTransport({
      host: this.secrets.mailHost,
      port: this.secrets.mailPort,
      secure: this.secrets.mailSecure,
      auth: {
        user: this.secrets.mailUser,
        pass: this.secrets.mailPass,
      },
    });

    await transporter.sendMail({
      from: this.secrets.mailFrom,
      to,
      subject,
      text,
      html,
    });
  }
}
