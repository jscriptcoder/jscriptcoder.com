import { useMemo } from 'react';
import { useFileSystem } from '../filesystem';
import { useSession } from '../context/SessionContext';
import { createPwdCommand } from '../commands/pwd';
import { createLsCommand } from '../commands/ls';
import { createCdCommand } from '../commands/cd';
import { createCatCommand } from '../commands/cat';
import { createWhoamiCommand } from '../commands/whoami';
import type { Command } from '../components/Terminal/types';

export const useFileSystemCommands = (): Map<string, Command> => {
  const { currentPath, setCurrentPath, resolvePath, getNode } = useFileSystem();
  const { session } = useSession();

  return useMemo(() => {
    const commands = new Map<string, Command>();

    const getCurrentPath = () => currentPath;
    const getUserType = () => session.userType;
    const getUsername = () => session.username;
    const getHomePath = () => {
      if (session.userType === 'root') return '/root';
      if (session.userType === 'guest') return '/home/guest';
      return `/home/${session.username}`;
    };

    // pwd command
    commands.set('pwd', createPwdCommand(getCurrentPath));

    // whoami command
    commands.set('whoami', createWhoamiCommand(getUsername));

    // ls command
    commands.set('ls', createLsCommand({
      getCurrentPath,
      resolvePath,
      getNode,
      getUserType,
    }));

    // cd command
    commands.set('cd', createCdCommand({
      resolvePath,
      getNode,
      setCurrentPath,
      getUserType,
      getHomePath,
    }));

    // cat command
    commands.set('cat', createCatCommand({
      resolvePath,
      getNode,
      getUserType,
    }));

    return commands;
  }, [currentPath, setCurrentPath, resolvePath, getNode, session]);
};
