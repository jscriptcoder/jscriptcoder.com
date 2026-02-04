import type { Command } from '../../components/Terminal/types';

// The backdoor exposes a limited virtual filesystem
const BACKDOOR_FILES = ['readme.txt', 'credentials.txt', '.secret'];

export const ncLsCommand: Command = {
  name: 'ls',
  description: 'List files in backdoor directory',
  fn: (): string => BACKDOOR_FILES.join('  '),
};
