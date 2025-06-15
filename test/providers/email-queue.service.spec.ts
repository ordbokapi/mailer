import { EmailQueueService } from '../../src/providers/email-queue.service';
import { DataService } from '../../src/providers/data.service';
import { AppSecretsService } from '../../src/providers/app-secrets.provider';
import { TemplateName } from '../../src/providers/template.service';

describe('EmailQueueService', () => {
  let service: EmailQueueService;
  let dataService: Partial<DataService>;
  let secrets: Partial<AppSecretsService>;

  beforeEach(() => {
    dataService = { queueEmail: jest.fn().mockResolvedValue(undefined) };

    secrets = {
      frontendUrl: 'https://example.com',
    } as unknown as AppSecretsService;

    service = new EmailQueueService(
      dataService as DataService,
      secrets as AppSecretsService,
    );
  });

  it('should queue verification email', async () => {
    await service.queueVerificationEmail({
      email: 'user@test.com',
      token: 'tok123',
    });

    expect(dataService.queueEmail).toHaveBeenCalledWith({
      addresses: ['user@test.com'],
      params: { verificationUrl: 'https://example.com/verify/?token=tok123' },
      subject: expect.stringContaining('Stadfest'),
      template: TemplateName.Verification,
    });
  });

  it('should queue signed up email', async () => {
    await service.queueSignedUpEmail({ email: 'user@test.com' });

    expect(dataService.queueEmail).toHaveBeenCalledWith({
      addresses: ['user@test.com'],
      params: {},
      subject: expect.stringContaining('Velkomen'),
      template: TemplateName.SignedUp,
      needsUnsubscribeLink: true,
    });
  });

  it('should queue new post email', async () => {
    const params = {
      title: 'Title',
      url: 'https://example.com',
      summary: 'Sum',
      unsubscribeUrl: 'https://example.com/unsub',
    };

    await service.queueNewPostEmail(params);

    expect(dataService.queueEmail).toHaveBeenCalledWith({
      params,
      subject: expect.stringContaining('Nytt innlegg: Title'),
      template: TemplateName.NewPost,
      needsUnsubscribeLink: true,
    });
  });
});
