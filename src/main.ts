import { LogLevel } from '@nestjs/common';
import * as childProcess from 'child_process';
import { isProd } from './utils';
import { start as startApi } from './api/entrypoint';
import { start as startWorker } from './worker/entrypoint';

async function main() {
  if (process.argv.includes('--help')) {
    console.log(`Usage: node ${process.argv[1]} [options]
  Options:
  --help                   Show this help message
  --port <num>             Specify the port to listen on
  --log-level <log-level>  Specify the minimum log level to display
  --debug-cache            Cache debug mode, logs cache stats every second.
                          Disables other logs.
  --prod                   Run in production mode
  --worker                 Run worker. If not specified, runs the API server.
  --dual                   Run both the API server and the worker. Not
                          recommended for production use.
  `);
    process.exit(0);
  }

  const prod = isProd();

  // If the --dual flag is passed, start both the API server and the worker as
  // separate processes
  if (process.argv.includes('--dual')) {
    console.warn(
      (prod ? '' : '\x1b[33m') +
        'Running both the API server and the worker in the same process is not recommended for production use' +
        (prod ? '' : '\x1b[0m'),
    );

    const args = process.argv.filter((arg) => arg !== '--dual');

    const api = childProcess.fork(process.argv[1], args);
    const worker = childProcess.fork(process.argv[1], args.concat('--worker'));

    // Forward SIGINT and SIGTERM signals to the child processes
    process.on('SIGINT', () => {
      api.kill('SIGINT');
      worker.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      api.kill('SIGTERM');
      worker.kill('SIGTERM');
    });

    process.on('exit', () => {
      api.kill();
      worker.kill();
    });

    // Wait for the child processes to exit
    api.on('exit', (code) => {
      process.exit(code || 0);
    });

    worker.on('exit', (code) => {
      process.exit(code || 0);
    });

    return;
  }

  // Define log levels in order of severity
  const logLevels: LogLevel[] = [
    'verbose',
    'debug',
    'log',
    'warn',
    'error',
    'fatal',
  ];

  if (prod) {
    console.log('Running in production mode');
  }

  // Get log level from command parameters or environment variable
  let minLogLevel = process.argv.includes('--log-level')
    ? process.argv[process.argv.indexOf('--log-level') + 1]
    : prod
      ? 'warn'
      : 'verbose';

  // Validate and normalize the log level
  if (!logLevels.includes(minLogLevel as LogLevel)) {
    console.warn(`Invalid log level "${minLogLevel}", defaulting to "verbose"`);
    minLogLevel = 'verbose';
  }

  // Compute an array of log levels to be passed to the logger
  const logLevelArray = logLevels.slice(
    logLevels.indexOf(minLogLevel as LogLevel),
  );

  // Disable colour logging in production
  if (prod) {
    process.env.NO_COLOR = 'true';
  }

  const port = process.argv.includes('--port')
    ? Number.parseInt(process.argv[process.argv.indexOf('--port') + 1], 10)
    : process.env.PORT
      ? Number.parseInt(process.env.PORT, 10)
      : 3000;

  if (process.argv.includes('--worker')) {
    startWorker({ logLevels: logLevelArray });
  } else {
    startApi({ port, logLevels: logLevelArray });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
