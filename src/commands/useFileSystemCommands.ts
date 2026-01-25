import { useMemo } from 'react';
import { useFileSystem } from '../filesystem';
import { useSession } from '../context/SessionContext';
import { createPwdCommand } from './pwd';
import { createLsCommand } from './ls';
import { createCdCommand } from './cd';
import { createCatCommand } from './cat';
import type { Command } from '../components/Terminal/types';

export const useFileSystemCommands = (): Map<string, Command> => {
  const { currentPath, setCurrentPath, resolvePath, getNode } = useFileSystem();
  const { session } = useSession();

  return useMemo(() => {
    const commands = new Map<string, Command>();

    const getCurrentPath = () => currentPath;
    const getUserType = () => session.userType;
    const getHomePath = () => {
      if (session.userType === 'root') return '/root';
      if (session.userType === 'guest') return '/home/guest';
      return `/home/${session.username}`;
    };

    // pwd command
    commands.set('pwd', createPwdCommand(getCurrentPath));

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
