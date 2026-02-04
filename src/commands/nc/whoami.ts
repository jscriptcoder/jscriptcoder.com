import type { Command } from '../../components/Terminal/types';

export const ncWhoamiCommand: Command = {
  name: 'whoami',
  description: 'Show current user',
  fn: (): string => 'anonymous',
};
