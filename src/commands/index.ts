import type { Command } from '../components/Terminal/types';
import { createHelpCommand } from './help';
import { echoCommand } from './echo';

const commands = new Map<string, Command>();

// Helper to get all commands (used by help)
const getCommands = () => commands;

// Register commands
const helpCommand = createHelpCommand(getCommands);
commands.set('help', helpCommand);
commands.set('echo', echoCommand);

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
