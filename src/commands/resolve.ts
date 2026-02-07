import type { Command, AsyncOutput } from '../components/Terminal/types';
import { stringify } from '../utils/stringify';

const RESOLVE_DELAY_MS = 100;

const isPromise = (value: unknown): value is Promise<unknown> =>
  value !== null &&
  typeof value === 'object' &&
  'then' in value &&
  typeof (value as Promise<unknown>).then === 'function';

export const createResolveCommand = (): Command => ({
  name: 'resolve',
  description: 'Unwrap a Promise and display its resolved value',
  manual: {
    synopsis: 'resolve(promise)',
    description:
      'Waits for a Promise to resolve and displays its value. ' +
      'Useful for unwrapping the result of async commands like output(ping(...)) ' +
      'when you forgot to use await. If the value is not a Promise, it is displayed directly.',
    arguments: [
      {
        name: 'promise',
        description: 'The Promise to resolve (or any value to display)',
        required: true,
      },
    ],
    examples: [
      {
        command: 'const p = output(ping("host")); resolve(p)',
        description: 'Resolve a Promise stored in a variable',
      },
      {
        command: 'resolve(myVariable)',
        description: 'Display the value of any variable',
      },
    ],
  },
  fn: (value: unknown): AsyncOutput => {
    let cancelled = false;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    return {
      __type: 'async',
      start: (onLine, onComplete) => {
        if (!isPromise(value)) {
          // Not a Promise, just display the value
          onLine(stringify(value));
          onComplete();
          return;
        }

        onLine('Resolving...');

        const timeoutId = setTimeout(() => {
          if (cancelled) return;

          value
            .then((resolved) => {
              if (cancelled) return;
              onLine('');
              onLine(stringify(resolved));
              onComplete();
            })
            .catch((error: unknown) => {
              if (cancelled) return;
              onLine('');
              const errorMessage = error instanceof Error ? error.message : String(error);
              onLine(`Error: ${errorMessage}`);
              onComplete();
            });
        }, RESOLVE_DELAY_MS);

        timeoutIds.push(timeoutId);
      },
      cancel: () => {
        cancelled = true;
        timeoutIds.forEach((id) => clearTimeout(id));
      },
    };
  },
});
