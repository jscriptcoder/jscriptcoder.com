import type { Command } from '../components/Terminal/types';

export const echoCommand: Command = {
  name: 'echo',
  description: 'Output the given value as a string',
  fn: (value: unknown): string => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  },
};
