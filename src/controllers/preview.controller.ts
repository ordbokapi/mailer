// SPDX-FileCopyrightText: Copyright (C) 2024 Adaline Simonian
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// This file is part of Ordbok API.
//
// Ordbok API is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.
//
// Ordbok API is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
// details.
//
// You should have received a copy of the GNU Affero General Public License
// along with Ordbok API. If not, see <https://www.gnu.org/licenses/>.

import { Controller, Get, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { TemplateName, TemplateService } from '../providers';
import { DevOnly } from '../utils';

@Controller()
@DevOnly()
export class PreviewController {
  constructor(private readonly templateService: TemplateService) {}

  @Get('/preview/new-post')
  getHello(@Query('plain') plain: boolean, @Res() res: FastifyReply): void {
    const [html, text] = this.templateService.render(TemplateName.NewPost, {
      title: 'New Post',
      url: 'https://example.com/posts/123',
      summary: `Lorem ipsum dolor sit amet, consectetur adipisici-elite, sed do eiusmod tempor-incidi dunte ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exerci-tation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehen-derit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaeca-tcupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Praesent sapien massa, convallis a pellen-tesque nec, egestas non nisi. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Vivamus suscipit tortor eget felis porttitor volut-pat. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Sed porttitor lectus nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.

Mauris blandit aliquet eli-tigula, eget tincidunt nibh pulvinar a. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Pellentesque in ipsum id orci porta dapibus. Proin eget tortor risus. Pellentesque in ipsum id orci porta dapibus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.
`,
      unsubscribeUrl: 'https://example.com/unsubscribe/123',
    });

    if (plain) {
      res.header('Content-Type', 'text/plain; charset=utf-8').send(text);
      return;
    }

    res.header('Content-Type', 'text/html').send(html);
  }

  @Get('/preview/verification')
  getVerification(
    @Query('plain') plain: boolean,
    @Res() res: FastifyReply,
  ): void {
    const [html, text] = this.templateService.render(
      TemplateName.Verification,
      {
        verificationUrl: 'https://example.com/verify/123',
      },
    );

    if (plain) {
      res.header('Content-Type', 'text/plain; charset=utf-8').send(text);
      return;
    }

    res.header('Content-Type', 'text/html').send(html);
  }

  @Get('/preview/signed-up')
  getSignedUp(@Query('plain') plain: boolean, @Res() res: FastifyReply): void {
    const [html, text] = this.templateService.render(TemplateName.SignedUp, {
      unsubscribeUrl: 'https://example.com/unsubscribe/123',
    });

    if (plain) {
      res.header('Content-Type', 'text/plain; charset=utf-8').send(text);
    }

    res.header('Content-Type', 'text/html').send(html);
  }
}
