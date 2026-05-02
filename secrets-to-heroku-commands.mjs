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

import { promises as fs } from 'fs';

// reads the secrets.json file and prints a list of heroku CLI commands to set
// the respective environment variables

const camelCaseToEnvVar = (key) =>
  key.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();

const path = process.argv[2] || 'secrets.json';
const secrets = JSON.parse(await fs.readFile(path, 'utf8'));

for (const [key, value] of Object.entries(secrets)) {
  console.log(`heroku config:set ${camelCaseToEnvVar(key)}=${value}`);
}
