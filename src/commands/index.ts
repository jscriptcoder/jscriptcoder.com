import type { Command } from '../components/Terminal/types';
import { createHelpCommand } from './help';
import { echoCommand } from './echo';
import { authorCommand } from './author';
import { clearCommand } from './clear';

const commands = new Map<string, Command>();
const fsCommands = new Map<string, Command>();

// Helper to get all commands (used by help)
const getCommands = () => Array.from(commands.values()).concat(Array.from(fsCommands.values()));

// Register commands
const helpCommand = createHelpCommand(getCommands);
commands.set('help', helpCommand);
commands.set('echo', echoCommand);
commands.set('author', authorCommand);
commands.set('clear', clearCommand);

// Filesystem commands (stubs for help listing - actual implementations in useFileSystemCommands)
const fsCommandStub = (name: string, description: string): Command => ({
  name,
  description,
  fn: () => { throw new Error('Command not available'); },
});
fsCommands.set('pwd', fsCommandStub('pwd', 'Print current working directory'));
fsCommands.set('ls', fsCommandStub('ls', 'List directory contents'));
fsCommands.set('cd', fsCommandStub('cd', 'Change current directory'));
fsCommands.set('cat', fsCommandStub('cat', 'Display file contents'));

// Create execution context with all commands as callable functions
export const createExecutionContext = (extraCommands?: Map<string, Command>): Record<string, (...args: unknown[]) => unknown> => {
  const context: Record<string, (...args: unknown[]) => unknown> = {};

  commands.forEach((cmd, name) => {
    context[name] = cmd.fn;
  });

  if (extraCommands) {
    extraCommands.forEach((cmd, name) => {
      context[name] = cmd.fn;
    });
  }

  return context;
};

// Get command names for autocompletion
export const getCommandNames = (): string[] => {
  return Array.from(commands.keys());
};
