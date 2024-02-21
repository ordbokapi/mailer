import { Controller, Get } from '@nestjs/common';
import { AppSecretsService, EmailQueueService } from '../providers';
import { DevOnly, pickRandom } from '../utils';

@Controller()
@DevOnly()
export class TestController {
  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly secrets: AppSecretsService,
  ) {}

  @Get('/test/new-post')
  async newPost(): Promise<string> {
    await this.emailQueue.queueNewPostEmail({
      title: pickRandom([
        'Duis aute irure dolor in reprehen-derit',
        'Excepteur sint occaeca-tcupidatat non proident',
        'Lorem ipsum dolor sit amet, consectetur adipisici-elite',
      ]),
      url: pickRandom([
        `${this.secrets.frontendUrl}/post/62438/lorem-ipsum`,
        `${this.secrets.frontendUrl}/post/71702/excepteur-sint`,
        `${this.secrets.frontendUrl}/post/81920/duis-aute-irure`,
      ]),
      summary: pickRandom([
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      ]),
    });

    return 'Email queued';
  }
}
