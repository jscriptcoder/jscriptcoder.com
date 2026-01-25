import type { Command } from '../components/Terminal/types';

export const createHelpCommand = (getCommands: () => Map<string, Command>): Command => ({
  name: 'help',
  description: 'Display list of available commands',
  fn: () => {
    const commands = getCommands();
    const lines = ['Available commands:', ''];

    const sortedCommands = Array.from(commands.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    sortedCommands.forEach((cmd) => {
      lines.push(`  ${cmd.name}() - ${cmd.description}`);
    });

    return lines.join('\n');
  },
});
