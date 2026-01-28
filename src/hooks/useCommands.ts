import { useMemo } from 'react';
import type { Command } from '../components/Terminal/types';
import { echoCommand } from '../commands/echo';
import { authorCommand } from '../commands/author';
import { clearCommand } from '../commands/clear';
import { suCommand } from '../commands/su';
import { createHelpCommand } from '../commands/help';
import { createManCommand } from '../commands/man';
import { useFileSystemCommands } from './useFileSystemCommands';
import { useNetworkCommands } from './useNetworkCommands';

interface UseCommandsResult {
  executionContext: Record<string, (...args: unknown[]) => unknown>;
  commandNames: string[];
}

export const useCommands = (): UseCommandsResult => {
  const fileSystemCommands = useFileSystemCommands();
  const networkCommands = useNetworkCommands();

  return useMemo(() => {
    const commands = new Map<string, Command>();

    // Static commands
    commands.set('echo', echoCommand);
    commands.set('author', authorCommand);
    commands.set('clear', clearCommand);
    commands.set('su', suCommand);

    // Filesystem commands
    fileSystemCommands.forEach((cmd, name) => commands.set(name, cmd));

    // Network commands
    networkCommands.forEach((cmd, name) => commands.set(name, cmd));

    // Create help and man with access to all commands
    const getCommandsArray = () => Array.from(commands.values());
    const getCommandsMap = () => commands;

    const helpCommand = createHelpCommand(getCommandsArray);
    const manCommand = createManCommand(getCommandsMap);

    commands.set('help', helpCommand);
    commands.set('man', manCommand);

    // Build execution context
    const executionContext: Record<string, (...args: unknown[]) => unknown> = {};
    commands.forEach((cmd, name) => {
      executionContext[name] = cmd.fn;
    });

    // Get command names for autocomplete
    const commandNames = Array.from(commands.keys());

    return { executionContext, commandNames };
  }, [fileSystemCommands, networkCommands]);
};
