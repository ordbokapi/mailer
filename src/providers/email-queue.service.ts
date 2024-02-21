import { Injectable } from '@nestjs/common';
import { DataService, TemplateParams } from './data.service';
import { TemplateName } from './template.service';

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
      template: TemplateName.Verification,
    });
  }

  async queueSignedUpEmail(data: { email: string }): Promise<void> {
    await this.data.queueEmail({
      addresses: [data.email],
      params: {},
      subject: 'Ordbok API Utviklingsblogg: Velkomen!',
      template: TemplateName.SignedUp,
      needsUnsubscribeLink: true,
    });
  }

  async queueNewPostEmail(
    data: TemplateParams<TemplateName.NewPost>,
  ): Promise<void> {
    await this.data.queueEmail({
      params: data,
      subject: `Ordbok API Utviklingsblogg: Ny bloggpost: ${data.title}`,
      template: TemplateName.NewPost,
      needsUnsubscribeLink: true,
    });
  }
}
