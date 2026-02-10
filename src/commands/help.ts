import type { Command } from '../components/Terminal/types';

export const createHelpCommand = (getCommands: () => Command[]): Command => ({
  name: 'help',
  description: 'Display list of available commands',
  manual: {
    synopsis: 'help()',
    description:
      'Display a list of all available commands with their short descriptions. For detailed information about a specific command, use man(command).',
    examples: [{ command: 'help()', description: 'List all available commands' }],
  },
  fn: () => {
    const commands = getCommands();
    const lines = ['Available commands:', ''];

    const sortedCommands = [...commands].sort((a, b) => a.name.localeCompare(b.name));

    sortedCommands.forEach((cmd) => {
      lines.push(` ${cmd.manual?.synopsis ?? cmd.name + '()'} - ${cmd.description}`);
    });

    return lines.join('\n');
  },
});
