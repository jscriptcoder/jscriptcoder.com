import { useMemo } from 'react';
import { useNetwork } from '../network';
import { useFileSystem } from '../filesystem';
import { createIfconfigCommand } from '../commands/ifconfig';
import { createPingCommand } from '../commands/ping';
import { createNmapCommand } from '../commands/nmap';
import { createNslookupCommand } from '../commands/nslookup';
import { createSshCommand } from '../commands/ssh';
import { createFtpCommand } from '../commands/ftp';
import { createNcCommand } from '../commands/nc';
import { createCurlCommand } from '../commands/curl';
import type { Command } from '../components/Terminal/types';

export const useNetworkCommands = (): Map<string, Command> => {
  const { getInterfaces, getInterface, getMachine, getMachines, getLocalIP, resolveDomain, getGateway } = useNetwork();
  const { readFileFromMachine } = useFileSystem();

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

    // nslookup command
    commands.set('nslookup', createNslookupCommand({
      resolveDomain,
      getGateway,
    }));

    // ssh command
    commands.set('ssh', createSshCommand({
      getMachine,
      getLocalIP,
    }));

    // ftp command
    commands.set('ftp', createFtpCommand({
      getMachine,
      getLocalIP,
      resolveDomain,
    }));

    // nc (netcat) command
    commands.set('nc', createNcCommand({
      getMachine,
      getLocalIP,
      resolveDomain,
    }));

    // curl command
    commands.set('curl', createCurlCommand({
      getMachine,
      resolveDomain,
      readFileFromMachine,
    }));

    return commands;
  }, [getInterfaces, getInterface, getMachine, getMachines, getLocalIP, resolveDomain, getGateway, readFileFromMachine]);
};
