import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { NetworkConfig, NetworkInterface, RemoteMachine, DnsRecord } from './types';
import { createInitialNetwork } from './initialNetwork';

interface NetworkContextType {
  readonly config: NetworkConfig;
  readonly getInterface: (name: string) => NetworkInterface | undefined;
  readonly getInterfaces: () => readonly NetworkInterface[];
  readonly getMachine: (ip: string) => RemoteMachine | undefined;
  readonly getMachines: () => readonly RemoteMachine[];
  readonly getGateway: () => string;
  readonly getLocalIP: () => string;
  readonly resolveDomain: (domain: string) => DnsRecord | undefined;
  readonly getDnsRecords: () => readonly DnsRecord[];
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [config] = useState<NetworkConfig>(createInitialNetwork);

  const getInterface = useCallback((name: string): NetworkInterface | undefined => {
    return config.interfaces.find(iface => iface.name === name);
  }, [config.interfaces]);

  const getInterfaces = useCallback((): readonly NetworkInterface[] => {
    return config.interfaces;
  }, [config.interfaces]);

  const getMachine = useCallback((ip: string): RemoteMachine | undefined => {
    return config.machines.find(machine => machine.ip === ip);
  }, [config.machines]);

  const getMachines = useCallback((): readonly RemoteMachine[] => {
    return config.machines;
  }, [config.machines]);

  const getGateway = useCallback((): string => {
    const eth0 = config.interfaces.find(iface => iface.name === 'eth0');
    return eth0?.gateway ?? '0.0.0.0';
  }, [config.interfaces]);

  const getLocalIP = useCallback((): string => {
    const eth0 = config.interfaces.find(iface => iface.name === 'eth0');
    return eth0?.inet ?? '0.0.0.0';
  }, [config.interfaces]);

  const resolveDomain = useCallback((domain: string): DnsRecord | undefined => {
    const normalizedDomain = domain.toLowerCase();
    return config.dnsRecords.find(record => record.domain.toLowerCase() === normalizedDomain);
  }, [config.dnsRecords]);

  const getDnsRecords = useCallback((): readonly DnsRecord[] => {
    return config.dnsRecords;
  }, [config.dnsRecords]);

  return (
    <NetworkContext.Provider value={{
      config,
      getInterface,
      getInterfaces,
      getMachine,
      getMachines,
      getGateway,
      getLocalIP,
      resolveDomain,
      getDnsRecords,
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
