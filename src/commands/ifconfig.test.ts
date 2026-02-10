import { describe, it, expect } from 'vitest';
import type { NetworkInterface } from '../network/types';
import { createIfconfigCommand } from './ifconfig';

// --- Factory Functions ---

const getMockNetworkInterface = (overrides?: Partial<NetworkInterface>): NetworkInterface => ({
  name: 'eth0',
  flags: ['UP', 'BROADCAST', 'RUNNING', 'MULTICAST'],
  inet: '192.168.1.100',
  netmask: '255.255.255.0',
  gateway: '192.168.1.1',
  mac: '02:42:ac:11:00:02',
  ...overrides,
});

type IfconfigContextConfig = {
  readonly interfaces?: readonly NetworkInterface[];
};

const createMockIfconfigContext = (config: IfconfigContextConfig = {}) => {
  const { interfaces = [getMockNetworkInterface()] } = config;

  return {
    getInterfaces: () => interfaces,
    getInterface: (name: string) => interfaces.find((i) => i.name === name),
  };
};

// --- Tests ---

describe('ifconfig command', () => {
  describe('listing all interfaces', () => {
    it('should list all interfaces when no argument given', () => {
      const context = createMockIfconfigContext({
        interfaces: [
          getMockNetworkInterface({ name: 'eth0', inet: '192.168.1.100' }),
          getMockNetworkInterface({ name: 'lo', inet: '127.0.0.1', flags: ['UP', 'LOOPBACK'] }),
        ],
      });

      const ifconfig = createIfconfigCommand(context);
      const result = String(ifconfig.fn());

      expect(result).toContain('eth0');
      expect(result).toContain('192.168.1.100');
      expect(result).toContain('lo');
      expect(result).toContain('127.0.0.1');
    });

    it('should return message when no interfaces available', () => {
      const context = createMockIfconfigContext({
        interfaces: [],
      });

      const ifconfig = createIfconfigCommand(context);
      const result = ifconfig.fn();

      expect(result).toBe('No active interfaces');
    });
  });

  describe('specific interface', () => {
    it('should show only the specified interface', () => {
      const context = createMockIfconfigContext({
        interfaces: [
          getMockNetworkInterface({ name: 'eth0', inet: '192.168.1.100' }),
          getMockNetworkInterface({ name: 'eth1', inet: '10.0.0.50' }),
        ],
      });

      const ifconfig = createIfconfigCommand(context);
      const result = String(ifconfig.fn('eth1'));

      expect(result).toContain('eth1');
      expect(result).toContain('10.0.0.50');
      expect(result).not.toContain('eth0');
      expect(result).not.toContain('192.168.1.100');
    });

    it('should throw error for unknown interface', () => {
      const context = createMockIfconfigContext({
        interfaces: [getMockNetworkInterface({ name: 'eth0' })],
      });

      const ifconfig = createIfconfigCommand(context);

      expect(() => ifconfig.fn('eth99')).toThrow("ifconfig: interface 'eth99' not found");
    });
  });

  describe('output formatting', () => {
    it('should format flags correctly', () => {
      const context = createMockIfconfigContext({
        interfaces: [
          getMockNetworkInterface({
            name: 'eth0',
            flags: ['UP', 'BROADCAST', 'RUNNING'],
          }),
        ],
      });

      const ifconfig = createIfconfigCommand(context);
      const result = String(ifconfig.fn());

      expect(result).toContain('flags=4163<UP,BROADCAST,RUNNING>');
    });

    it('should format inet and netmask', () => {
      const context = createMockIfconfigContext({
        interfaces: [
          getMockNetworkInterface({
            inet: '10.0.0.1',
            netmask: '255.0.0.0',
          }),
        ],
      });

      const ifconfig = createIfconfigCommand(context);
      const result = String(ifconfig.fn());

      expect(result).toContain('inet 10.0.0.1');
      expect(result).toContain('netmask 255.0.0.0');
    });

    it('should format gateway', () => {
      const context = createMockIfconfigContext({
        interfaces: [
          getMockNetworkInterface({
            gateway: '192.168.1.1',
          }),
        ],
      });

      const ifconfig = createIfconfigCommand(context);
      const result = String(ifconfig.fn());

      expect(result).toContain('gateway 192.168.1.1');
    });

    it('should format MAC address', () => {
      const context = createMockIfconfigContext({
        interfaces: [
          getMockNetworkInterface({
            mac: 'aa:bb:cc:dd:ee:ff',
          }),
        ],
      });

      const ifconfig = createIfconfigCommand(context);
      const result = String(ifconfig.fn());

      expect(result).toContain('ether aa:bb:cc:dd:ee:ff');
    });

    it('should separate multiple interfaces with blank line', () => {
      const context = createMockIfconfigContext({
        interfaces: [
          getMockNetworkInterface({ name: 'eth0' }),
          getMockNetworkInterface({ name: 'eth1' }),
        ],
      });

      const ifconfig = createIfconfigCommand(context);
      const result = String(ifconfig.fn());

      expect(result).toContain('\n\n');
    });
  });
});
