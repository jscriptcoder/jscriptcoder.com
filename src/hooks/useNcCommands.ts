import { useMemo } from 'react';
import type { Command } from '../components/Terminal/types';
import { ncHelpCommand } from '../commands/nc/help';
import { ncWhoamiCommand } from '../commands/nc/whoami';
import { ncLsCommand } from '../commands/nc/ls';
import { ncCatCommand } from '../commands/nc/cat';
import { ncExitCommand } from '../commands/nc/exit';

export const useNcCommands = (): Map<string, Command> => {
  return useMemo(() => {
    const commands = new Map<string, Command>();

    commands.set('help', ncHelpCommand);
    commands.set('whoami', ncWhoamiCommand);
    commands.set('ls', ncLsCommand);
    commands.set('cat', ncCatCommand);
    commands.set('exit', ncExitCommand);

    return commands;
  }, []);
};
