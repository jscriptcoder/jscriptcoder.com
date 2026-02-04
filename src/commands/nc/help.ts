import type { Command } from '../../components/Terminal/types';

export const ncHelpCommand: Command = {
  name: 'help',
  description: 'Show available commands',
  fn: (): string => {
    const lines = [
      'help    whoami    ls    cat    exit',
    ];
    return lines.join('\n');
  },
};
