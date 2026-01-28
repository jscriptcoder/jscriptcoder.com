import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { NetworkConfig, NetworkInterface, RemoteMachine } from './types';
import { createInitialNetwork } from './initialNetwork';

interface NetworkContextType {
  config: NetworkConfig;
  getInterface: (name: string) => NetworkInterface | undefined;
  getInterfaces: () => NetworkInterface[];
  getMachine: (ip: string) => RemoteMachine | undefined;
  getMachines: () => RemoteMachine[];
  getGateway: () => string;
  getLocalIP: () => string;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [config] = useState<NetworkConfig>(createInitialNetwork);

  const getInterface = useCallback((name: string): NetworkInterface | undefined => {
    return config.interfaces.find(iface => iface.name === name);
  }, [config.interfaces]);

  const getInterfaces = useCallback((): NetworkInterface[] => {
    return config.interfaces;
  }, [config.interfaces]);

  const getMachine = useCallback((ip: string): RemoteMachine | undefined => {
    return config.machines.find(machine => machine.ip === ip);
  }, [config.machines]);

  const getMachines = useCallback((): RemoteMachine[] => {
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

  return (
    <NetworkContext.Provider value={{
      config,
      getInterface,
      getInterfaces,
      getMachine,
      getMachines,
      getGateway,
      getLocalIP,
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
