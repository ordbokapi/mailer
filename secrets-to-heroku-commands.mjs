import { promises as fs } from 'fs';

// reads the secrets.json file and prints a list of heroku CLI commands to set
// the respective environment variables

const camelCaseToEnvVar = (key) =>
  key.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();

const secrets = JSON.parse(await fs.readFile('secrets.json', 'utf8'));

for (const [key, value] of Object.entries(secrets)) {
  console.log(`heroku config:set ${camelCaseToEnvVar(key)}=${value}`);
}
