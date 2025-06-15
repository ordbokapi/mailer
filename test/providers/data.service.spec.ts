import {
  DataService,
  Subscriber,
  PendingSubscriber,
} from '../../src/providers/data.service';
import { TemplateName } from '../../src/providers/template.service';
import { CryptoService } from '../../src/providers/crypto.service';
import { FakeRedisClient } from '../helpers/fake-redis-client';
import { AppSecretsService } from '../../src/providers/app-secrets.provider';

describe('DataService', () => {
  let service: DataService;
  let fakeClient: FakeRedisClient;
  let cryptoService: CryptoService;

  beforeEach(() => {
    fakeClient = new FakeRedisClient();

    const secretVals = {
      recordKey: Buffer.alloc(32, 0).toString('hex'),
      recordIV: Buffer.alloc(16, 0).toString('hex'),
      recordSalt: 'salt',
    } as AppSecretsService;

    cryptoService = new CryptoService(secretVals);

    service = new DataService(
      {} as AppSecretsService,
      cryptoService,
      fakeClient as any,
    );
  });

  it('should add and retrieve subscribers', async () => {
    const sub: Subscriber = { email: 'a@b.com', unsubscribeToken: 'token123' };

    await service.addSubscriber(sub);

    const all = await service.getSubscribers();

    expect(all).toEqual([sub]);
  });

  it('should remove subscriber and by token correctly', async () => {
    const sub: Subscriber = { email: 'x@y.com', unsubscribeToken: 'tokenX' };

    await service.addSubscriber(sub);
    expect(await service.isSubscribed('x@y.com')).toBe(true);
    expect(await service.removeSubscriber('x@y.com')).toBe(true);
    expect(await service.isSubscribed('x@y.com')).toBe(false);

    await service.addSubscriber(sub);
    expect(await service.removeSubscriberByToken('tokenX')).toBe(true);
    expect(await service.isSubscribed('x@y.com')).toBe(false);
  });

  it('should handle pending subscribers', async () => {
    const pending: PendingSubscriber = {
      email: 'p@q.com',
      verificationToken: 'ver123',
    };

    await service.addPendingSubscriber(pending, 60);

    const retrieved = await service.getPendingSubscriber('ver123');

    expect(retrieved).toEqual(pending);
    expect(await service.removePendingSubscriber('ver123')).toBe(true);
    expect(await service.getPendingSubscriber('ver123')).toBeNull();
  });

  it('should queue and dequeue emails', async () => {
    await service.queueEmail({
      addresses: ['user@example.com'],
      template: TemplateName.Verification,
      subject: 'subj',
      params: { verificationUrl: 'url' },
    });

    const email = await service.dequeueEmail();

    expect(email).toEqual({
      addresses: ['user@example.com'],
      template: TemplateName.Verification,
      subject: 'subj',
      params: { verificationUrl: 'url' },
    });
  });

  it('should get unsubscribe tokens', async () => {
    await service.addSubscriber({ email: 'foo@bar', unsubscribeToken: 't1' });
    await service.addSubscriber({ email: 'baz@bar', unsubscribeToken: 't2' });
    const tokens = await service.getUnsubscribeTokens(['foo@bar', 'none']);
    expect(tokens).toEqual(['t1', null]);
  });

  it('should close connection', async () => {
    await expect(service.close()).resolves.toBeUndefined();
  });
});
