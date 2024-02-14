/**
 * Error thrown when the error rate exceeds the limit.
 */
export class ConcurrencyError extends Error {
  readonly #errors: unknown[];
  readonly #results: unknown[];

  constructor(message: string, errors: unknown[], results: unknown[]) {
    super(message);

    this.#errors = errors;
    this.#results = results;
  }

  get name(): string {
    return 'ConcurrencyError';
  }

  /**
   * The errors that were encountered.
   */
  get errors(): unknown[] {
    return this.#errors.slice();
  }

  /**
   * The results returned by the function before the error rate exceeded the
   * limit.
   */
  get results(): unknown[] {
    return this.#results.slice();
  }
}

/**
 * Run the function with the given parameters with a maximum concurrency limit,
 * i.e. the maximum number of functions that can run at the same time. Returns a
 * promise that resolves when all the functions have been executed.
 *
 * The promise resolves with a tuple, where the first element is an array of
 * results returned by the function, and the second element is an array of
 * errors encountered.
 *
 * If the error rate exceeds the limit, the function will throw a
 * {@link ConcurrencyError}.
 * @param func The function to run.
 * @param parameters An array of parameter arrays to pass to the function.
 * @param concurrencyLimit The maximum number of functions that can run at the
 * same time.
 * @param maxErrorsPerSecond The maximum number of errors that can be
 * encountered per second. If this limit is reached, the function will throw an
 * error.
 * @returns A promise that resolves when all the functions have been executed.
 */
export async function runAllMaxConcurrency<
  F extends (...args: any[]) => any,
  P extends Parameters<F>[],
  R extends ReturnType<F>,
>(
  func: F,
  parameters: P,
  concurrencyLimit: number,
  maxErrorsPerSecond = 10,
): Promise<[R[], unknown[]]> {
  const errors: unknown[] = [];
  const results: R[] = [];
  const errorTimestamps: number[] = [];
  const generator = executor(parameters);
  let errored = false;

  function* executor(parameters: P): Generator<Promise<void>> {
    for (const params of parameters) {
      if (errored) {
        return;
      }

      yield func(...params)
        .then((result: R) => {
          results.push(result);
        })
        .catch((error: unknown) => {
          const now = Date.now();

          errors.push(error);
          errorTimestamps.push(now);

          // Remove timestamps older than 1 second from the current time
          while (
            errorTimestamps.length > 0 &&
            now - errorTimestamps[0] > 1000
          ) {
            errorTimestamps.shift();
          }

          // Check if error rate exceeds the limit
          if (errorTimestamps.length > maxErrorsPerSecond) {
            errored = true;
          }
        })
        .finally(() => {
          const nextPromise = generator.next();
          if (!nextPromise.done) {
            return nextPromise.value;
          }
        });
    }
  }

  const activePromises = [];

  while (activePromises.length < concurrencyLimit) {
    const next = generator.next();
    if (next.done) {
      break;
    }
    activePromises.push(next.value);
  }

  await Promise.all(activePromises);

  if (errored) {
    throw new ConcurrencyError(
      `Error rate exceeded ${maxErrorsPerSecond} errors per second.`,
      errors,
      results,
    );
  }

  return [results, errors];
}
