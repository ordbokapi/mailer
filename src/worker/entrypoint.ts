import {
  DataService,
  CryptoService,
  MailService,
  TemplateService,
  IAppSecrets,
} from '../providers';
import { workerData, parentPort } from 'worker_threads';
import { runAllMaxConcurrency, ConcurrencyError } from 'src/utils';

if (!workerData || !parentPort) {
  throw new Error('Worker must be started with workerData and parentPort');
}

const apiSecrets = workerData as IAppSecrets;

const cryptoService = new CryptoService(apiSecrets);
const mailService = new MailService(apiSecrets);
const templateService = new TemplateService();
const dataService = new DataService(apiSecrets, cryptoService);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const logger = {
  log(...entries: any[]) {
    parentPort!.postMessage(['log', ...entries]);
  },

  error(...entries: any[]) {
    parentPort!.postMessage(['error', ...entries]);
  },
};

async function main() {
  while (true) {
    const email = await dataService.dequeueEmail();

    if (email) {
      const succeeded: string[] = [];

      try {
        const { addresses, template, subject, params } = email;

        await runAllMaxConcurrency(
          async (email) => {
            const unsubscribeToken =
              await dataService.getUnsubscribeToken(email);

            if (!unsubscribeToken) {
              logger.error(
                `Failed to get unsubscribe token for email ${email}`,
              );
              return;
            }

            const [html, text] = templateService[
              template as keyof TemplateService
            ]({
              ...params,
              unsubscribeUrl: `https://blog.ordbokapi.org/unsubscribe?token=${unsubscribeToken}`,
            } as any);

            try {
              return mailService.sendMail({ to: email, subject, text, html });
            } catch (error) {
              logger.error(`Failed to send email to ${email}`, error);
              console.error(error);
            }

            succeeded.push(email);
          },
          addresses.map((address): [string] => [address]),
          5,
        );
      } catch (err) {
        logger.error('Failed to send emails', err);
        console.error(err);

        if (err instanceof ConcurrencyError) {
          logger.error(err.errors);
          console.error(err.errors);
        }

        // Re-enqueue the email at the end of the queue with only the addresses
        // that failed to receive the email
        await dataService.enqueueEmail(
          {
            template: email.template,
            subject: email.subject,
            params: email.params,
            addresses: email.addresses.filter(
              (address) => !succeeded.includes(address),
            ),
          },
          true,
        );

        await sleep(5 * 1000);
      }
    } else {
      await sleep(5 * 1000);
    }
  }
}

main().catch((err) => {
  logger.error('Worker failed');
  console.error(err);
  process.exit(1);
});

logger.log('Worker started');
