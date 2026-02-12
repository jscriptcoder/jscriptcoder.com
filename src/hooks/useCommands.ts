import { useMemo, useCallback } from 'react';
import type { Command } from '../components/Terminal/types';
import { echoCommand } from '../commands/echo';
import { authorCommand } from '../commands/author';
import { clearCommand } from '../commands/clear';
import { exitCommand } from '../commands/exit';
import { createSuCommand } from '../commands/su';
import { createHelpCommand } from '../commands/help';
import { createManCommand } from '../commands/man';
import { createResolveCommand } from '../commands/resolve';
import { createNodeCommand } from '../commands/node';
import { applyCommandRestrictions, getAccessibleCommandNames } from '../commands/permissions';
import { useFileSystemCommands } from './useFileSystemCommands';
import { useNetworkCommands } from './useNetworkCommands';
import { useSession } from '../session/SessionContext';
import { useNetwork } from '../network';
import { useFileSystem } from '../filesystem';

const LOCAL_USERS = ['root', 'jshacker', 'guest'] as const;

type UseCommandsResult = {
  readonly executionContext: Record<string, (...args: unknown[]) => unknown>;
  readonly commandNames: readonly string[];
};

export const useCommands = (): UseCommandsResult => {
  const fileSystemCommands = useFileSystemCommands();
  const networkCommands = useNetworkCommands();
  const { session } = useSession();
  const { getMachine } = useNetwork();
  const { resolvePath, getNode } = useFileSystem();

  const getUsers = useCallback((): readonly string[] => {
    if (session.machine === 'localhost') {
      return LOCAL_USERS;
    }
    const machine = getMachine(session.machine);
    return machine?.users.map((u) => u.username) ?? [];
  }, [session.machine, getMachine]);

  return useMemo(() => {
    // Mutable ref for circular dependency: node needs the execution context
    // which includes node itself. Set after building the full context.
    let resolvedExecutionContext: Record<string, (...args: unknown[]) => unknown> = {};

    const commands = new Map<string, Command>();

    // Static commands
    commands.set('echo', echoCommand);
    commands.set('author', authorCommand);
    commands.set('clear', clearCommand);
    commands.set('exit', exitCommand);
    commands.set('resolve', createResolveCommand());

    // User commands (depends on current machine)
    const suCommand = createSuCommand({ getUsers });
    commands.set('su', suCommand);

    // Node command (uses lazy getter for execution context)
    commands.set(
      'node',
      createNodeCommand({
        resolvePath,
        getNode,
        getUserType: () => session.userType,
        getExecutionContext: () => resolvedExecutionContext,
      }),
    );

    // Filesystem commands
    fileSystemCommands.forEach((cmd, name) => commands.set(name, cmd));

    // Network commands
    networkCommands.forEach((cmd, name) => commands.set(name, cmd));

    // Create help with filtered commands (only shows accessible ones)
    const getAccessibleCommands = () => {
      const accessible = getAccessibleCommandNames(Array.from(commands.keys()), session.userType);
      return accessible
        .map((name) => commands.get(name))
        .filter((cmd): cmd is Command => cmd !== undefined);
    };

    // Create man with all commands (can look up any command for learning)
    const getCommandsMap = () => commands;

    const helpCommand = createHelpCommand(getAccessibleCommands);
    const manCommand = createManCommand(getCommandsMap);

    commands.set('help', helpCommand);
    commands.set('man', manCommand);

    // Apply command restrictions (wraps restricted fns with permission check)
    const restrictedCommands = applyCommandRestrictions(commands, session.userType);

    // Build execution context from restricted commands
    const executionContext: Record<string, (...args: unknown[]) => unknown> = Object.fromEntries(
      Array.from(restrictedCommands.entries()).map(([name, cmd]) => [name, cmd.fn]),
    );

    // Resolve the execution context for node command's lazy getter
    resolvedExecutionContext = executionContext;

    // Only show accessible commands in autocomplete
    const commandNames = getAccessibleCommandNames(Array.from(commands.keys()), session.userType);

    return { executionContext, commandNames };
  }, [fileSystemCommands, networkCommands, getUsers, session.userType, resolvePath, getNode]);
};
