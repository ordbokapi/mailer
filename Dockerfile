# SPDX-FileCopyrightText: Copyright (C) 2024 Adaline Simonian
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# This file is part of Ordbok API.
#
# Ordbok API is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your option) any
# later version.
#
# Ordbok API is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License
# along with Ordbok API. If not, see <https://www.gnu.org/licenses/>.

# -----------------------------------------
# Build stage
# -----------------------------------------
FROM node:24.14.1-slim AS builder

WORKDIR /app

RUN corepack enable

COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/releases .yarn/releases

RUN yarn install --immutable

COPY src src
COPY templates templates
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

RUN yarn build

# -----------------------------------------
# Run stage
# -----------------------------------------
FROM node:24.14.1-slim

WORKDIR /app

RUN corepack enable

COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/releases .yarn/releases

RUN yarn workspaces focus --production

COPY --from=builder /app/dist dist
COPY templates templates

ENV NODE_ENV=production

EXPOSE 3000

CMD ["yarn", "start:prod"]
