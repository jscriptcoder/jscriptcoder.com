import type { Command } from '../../components/Terminal/types';

export const ncHelpCommand: Command = {
  name: 'help',
  description: 'Show available backdoor commands',
  fn: (): string => {
    const lines = [
      'Available commands:',
      '  help    - Show this help message',
      '  whoami  - Show current user',
      '  ls      - List files in current directory',
      '  cat     - Read file contents',
      '  exit    - Close connection',
    ];
    return lines.join('\n');
  },
};
