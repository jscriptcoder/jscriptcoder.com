import type { Command } from '../components/Terminal/types';
import { createHelpCommand } from './help';
import { echoCommand } from './echo';
import { authorCommand } from './author';
import { clearCommand } from './clear';
import { createManCommand } from './man';

const commands = new Map<string, Command>();
const fsCommands = new Map<string, Command>();

// Helper to get all commands as array (used by help)
const getCommands = () => 
  Array
  .from(commands.values())
  .concat(
    Array
      .from(fsCommands.values())
  );

// Helper to get all commands as Map (used by man)
const getCommandsMap = (): Map<string, Command> => {
  const allCommands = new Map<string, Command>();
  commands.forEach((cmd, name) => allCommands.set(name, cmd));
  fsCommands.forEach((cmd, name) => allCommands.set(name, cmd));
  return allCommands;
};

// Register commands
const helpCommand = createHelpCommand(getCommands);
const manCommand = createManCommand(getCommandsMap);
commands.set('help', helpCommand);
commands.set('man', manCommand);
commands.set('echo', echoCommand);
commands.set('author', authorCommand);
commands.set('clear', clearCommand);

// Filesystem commands (stubs for help/man listing - actual implementations in useFileSystemCommands)
fsCommands.set('pwd', {
  name: 'pwd',
  description: 'Print current working directory',
  manual: {
    synopsis: 'pwd()',
    description: 'Print the absolute path of the current working directory.',
    examples: [
      { command: 'pwd()', description: 'Show current directory path' },
    ],
  },
  fn: () => { throw new Error('Command not available'); },
});

fsCommands.set('ls', {
  name: 'ls',
  description: 'List directory contents',
  manual: {
    synopsis: 'ls([path])',
    description: 'List the contents of a directory. Directories are shown with a trailing slash. If no path is specified, lists the current directory.',
    arguments: [
      { name: 'path', description: 'Path to the directory to list (absolute or relative)', required: false },
    ],
    examples: [
      { command: 'ls()', description: 'List contents of current directory' },
      { command: 'ls("/")', description: 'List contents of root directory' },
      { command: 'ls("/home")', description: 'List contents of /home directory' },
      { command: 'ls("..")', description: 'List contents of parent directory' },
    ],
  },
  fn: () => { throw new Error('Command not available'); },
});

fsCommands.set('cd', {
  name: 'cd',
  description: 'Change current directory',
  manual: {
    synopsis: 'cd([path])',
    description: 'Change the current working directory. If no path is specified, changes to the home directory of the current user.',
    arguments: [
      { name: 'path', description: 'Path to the directory to change to (absolute or relative)', required: false },
    ],
    examples: [
      { command: 'cd()', description: 'Change to home directory' },
      { command: 'cd("/")', description: 'Change to root directory' },
      { command: 'cd("/etc")', description: 'Change to /etc directory' },
      { command: 'cd("..")', description: 'Change to parent directory' },
      { command: 'cd("subdir")', description: 'Change to a subdirectory' },
    ],
  },
  fn: () => { throw new Error('Command not available'); },
});

fsCommands.set('cat', {
  name: 'cat',
  description: 'Display file contents',
  manual: {
    synopsis: 'cat(path)',
    description: 'Display the contents of a file. The file must be readable by the current user.',
    arguments: [
      { name: 'path', description: 'Path to the file to display (absolute or relative)', required: true },
    ],
    examples: [
      { command: 'cat("/etc/passwd")', description: 'Display the passwd file' },
      { command: 'cat("readme.txt")', description: 'Display a file in the current directory' },
      { command: 'cat("../file.txt")', description: 'Display a file in the parent directory' },
    ],
  },
  fn: () => { throw new Error('Command not available'); },
});

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
