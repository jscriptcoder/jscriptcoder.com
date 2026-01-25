import type { Command } from '../components/Terminal/types';
import { createHelpCommand } from './help';
import { echoCommand } from './echo';
import { authorCommand } from './author';
import { clearCommand } from './clear';

const commands = new Map<string, Command>();

// Helper to get all commands (used by help)
const getCommands = () => commands;

// Register commands
const helpCommand = createHelpCommand(getCommands);
commands.set('help', helpCommand);
commands.set('echo', echoCommand);
commands.set('author', authorCommand);
commands.set('clear', clearCommand);

// Filesystem commands (stubs for help listing - actual implementations in useFileSystemCommands)
const fsCommandStub = (description: string): Command => ({
  name: '',
  description,
  fn: () => { throw new Error('Command not available'); },
});
commands.set('pwd', { ...fsCommandStub('Print current working directory'), name: 'pwd' });
commands.set('ls', { ...fsCommandStub('List directory contents'), name: 'ls' });
commands.set('cd', { ...fsCommandStub('Change current directory'), name: 'cd' });
commands.set('cat', { ...fsCommandStub('Display file contents'), name: 'cat' });

// Export command registry
export { commands };

// Create execution context with all commands as callable functions
export const createExecutionContext = (): Record<string, (...args: unknown[]) => unknown> => {
  const context: Record<string, (...args: unknown[]) => unknown> = {};

  commands.forEach((cmd, name) => {
    context[name] = cmd.fn;
  });

  return context;
};

// Get command names for autocompletion
export const getCommandNames = (): string[] => {
  return Array.from(commands.keys());
};
