import type { Command } from '../components/Terminal/types';

export const createPwdCommand = (getCurrentPath: () => string): Command => ({
  name: 'pwd',
  description: 'Print current working directory',
  fn: (): string => getCurrentPath(),
});
