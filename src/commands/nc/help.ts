import type { Command } from '../../components/Terminal/types';

export const ncHelpCommand: Command = {
  name: 'help',
  description: 'Show available commands',
  fn: (): string => 'pwd  cd  ls  cat  whoami  exit',
};
