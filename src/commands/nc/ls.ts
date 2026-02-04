import type { Command } from '../../components/Terminal/types';

const FILES = ['readme.txt', 'credentials.txt', '.secret'];

export const ncLsCommand: Command = {
  name: 'ls',
  description: 'List files',
  fn: (): string => FILES.join('  '),
};
