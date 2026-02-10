import type { Command } from '../components/Terminal/types';

export const createManCommand = (getCommands: () => Map<string, Command>): Command => ({
  name: 'man',
  description: 'Display manual for a command',
  manual: {
    synopsis: 'man(command: string)',
    description:
      'Display detailed documentation for a command, including description, arguments, and usage examples.',
    arguments: [
      { name: 'command', description: 'The name of the command to get help for', required: true },
    ],
    examples: [
      { command: 'man("ls")', description: 'Show manual for the ls command' },
      { command: 'man("cat")', description: 'Show manual for the cat command' },
    ],
  },
  fn: (...args: unknown[]): string => {
    const cmdName = args[0] as string | undefined;

    if (!cmdName) {
      throw new Error('man: missing command name\nUsage: man("command")');
    }

    const commands = getCommands();
    const cmd = commands.get(cmdName);

    if (!cmd) {
      throw new Error(`man: no manual entry for '${cmdName}'`);
    }

    const lines: string[] = [];

    // Header
    lines.push(`${cmd.name.toUpperCase()}(1)`);
    lines.push('');

    // Name section
    lines.push('NAME');
    lines.push(`    ${cmd.name} - ${cmd.description}`);
    lines.push('');

    if (cmd.manual) {
      // Synopsis
      lines.push('SYNOPSIS');
      lines.push(`    ${cmd.manual.synopsis}`);
      lines.push('');

      // Description
      lines.push('DESCRIPTION');
      lines.push(`    ${cmd.manual.description}`);
      lines.push('');

      // Arguments
      if (cmd.manual.arguments && cmd.manual.arguments.length > 0) {
        lines.push('ARGUMENTS');
        cmd.manual.arguments.forEach((arg) => {
          const required = arg.required ? ' (required)' : ' (optional)';
          lines.push(`    ${arg.name}${required}`);
          lines.push(`        ${arg.description}`);
        });
        lines.push('');
      }

      // Examples
      if (cmd.manual.examples && cmd.manual.examples.length > 0) {
        lines.push('EXAMPLES');
        cmd.manual.examples.forEach((ex) => {
          lines.push(`    ${ex.command}`);
          lines.push(`        ${ex.description}`);
          lines.push('');
        });
      }
    } else {
      lines.push('No detailed manual available for this command.');
      lines.push('');
    }

    return lines.join('\n');
  },
});
