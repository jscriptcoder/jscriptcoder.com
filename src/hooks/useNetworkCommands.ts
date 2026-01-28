import { useMemo } from 'react';
import { useNetwork } from '../network';
import { createIfconfigCommand } from '../commands/ifconfig';
import type { Command } from '../components/Terminal/types';

export const useNetworkCommands = (): Map<string, Command> => {
  const { getInterfaces, getInterface } = useNetwork();

  return useMemo(() => {
    const commands = new Map<string, Command>();

    // ifconfig command
    commands.set('ifconfig', createIfconfigCommand({
      getInterfaces,
      getInterface,
    }));

    return commands;
  }, [getInterfaces, getInterface]);
};
