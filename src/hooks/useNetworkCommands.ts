import { useMemo } from 'react';
import { useNetwork } from '../network';
import { createIfconfigCommand } from '../commands/ifconfig';
import { createPingCommand } from '../commands/ping';
import { createNmapCommand } from '../commands/nmap';
import type { Command } from '../components/Terminal/types';

export const useNetworkCommands = (): Map<string, Command> => {
  const { getInterfaces, getInterface, getMachine, getMachines, getLocalIP } = useNetwork();

  return useMemo(() => {
    const commands = new Map<string, Command>();

    // ifconfig command
    commands.set('ifconfig', createIfconfigCommand({
      getInterfaces,
      getInterface,
    }));

    // ping command
    commands.set('ping', createPingCommand({
      getMachine,
      getMachines,
      getLocalIP,
    }));

    // nmap command
    commands.set('nmap', createNmapCommand({
      getMachine,
      getMachines,
      getLocalIP,
    }));

    return commands;
  }, [getInterfaces, getInterface, getMachine, getMachines, getLocalIP]);
};
