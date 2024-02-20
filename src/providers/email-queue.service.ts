import { Injectable } from '@nestjs/common';
import { DataService } from './data.service';
import { Template } from './template.service';

@Injectable()
export class EmailQueueService {
  constructor(private readonly data: DataService) {}

  async queueVerificationEmail(data: {
    email: string;
    token: string;
  }): Promise<void> {
    await this.data.queueEmail({
      addresses: [data.email],
      params: {
        verificationUrl: `https://blog.ordbokapi.org/verify?token=${data.token}`,
      },
      subject: 'Ordbok API Utviklingsblogg: Stadfest e-postadressa di',
      template: Template.Verification,
    });
  }

  async queueSignedUpEmail(data: { email: string }): Promise<void> {
    await this.data.queueEmail({
      addresses: [data.email],
      params: {},
      subject: 'Ordbok API Utviklingsblogg: Velkomen!',
      template: Template.SignedUp,
      needsUnsubscribeLink: true,
    });
  }

  async queueNewPostEmail(data: {
    title: string;
    url: string;
    summary: string;
  }): Promise<void> {
    await this.data.queueEmail({
      params: {
        title: data.title,
        url: data.url,
        summary: data.summary,
      },
      subject: `Ordbok API Utviklingsblogg: Ny bloggpost: ${data.title}`,
      template: Template.NewPost,
      needsUnsubscribeLink: true,
    });
  }
}
