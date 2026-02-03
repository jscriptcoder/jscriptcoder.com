import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NetworkInterface, RemoteMachine, DnsRecord } from '../network/types';
import type { AsyncOutput, SshPromptData, FtpPromptData } from '../components/Terminal/types';
import { createIfconfigCommand } from './ifconfig';
import { createPingCommand } from './ping';
import { createNslookupCommand } from './nslookup';
import { createNmapCommand } from './nmap';
import { createSshCommand } from './ssh';
import { createFtpCommand } from './ftp';

// --- Factory Functions ---

const getMockNetworkInterface = (
  overrides?: Partial<NetworkInterface>
): NetworkInterface => ({
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

      expect(() => ifconfig.fn('eth99')).toThrow(
        "ifconfig: interface 'eth99' not found"
      );
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

// --- Ping Factory Functions ---

const getMockRemoteMachine = (overrides?: Partial<RemoteMachine>): RemoteMachine => ({
  ip: '192.168.1.50',
  hostname: 'fileserver',
  ports: [{ port: 22, service: 'ssh', open: true }],
  users: [{ username: 'root', passwordHash: 'abc123', userType: 'root' }],
  ...overrides,
});

type PingContextConfig = {
  readonly machines?: readonly RemoteMachine[];
  readonly localIP?: string;
};

const createMockPingContext = (config: PingContextConfig = {}) => {
  const { machines = [getMockRemoteMachine()], localIP = '192.168.1.100' } = config;

  return {
    getMachine: (ip: string) => machines.find((m) => m.ip === ip),
    getMachines: () => machines,
    getLocalIP: () => localIP,
  };
};

const isAsyncOutput = (value: unknown): value is AsyncOutput =>
  typeof value === 'object' &&
  value !== null &&
  '__type' in value &&
  (value as AsyncOutput).__type === 'async';

// --- Ping Tests ---

describe('ping command', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error handling', () => {
    it('should throw error when no host given', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);

      expect(() => ping.fn()).toThrow('ping: missing host operand');
    });

    it('should throw error when count is less than 1', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);

      expect(() => ping.fn('192.168.1.1', 0)).toThrow('ping: count must be between 1 and 10');
    });

    it('should throw error when count is greater than 10', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);

      expect(() => ping.fn('192.168.1.1', 11)).toThrow('ping: count must be between 1 and 10');
    });

    it('should throw error for unknown hostname', () => {
      const context = createMockPingContext({
        machines: [],
      });
      const ping = createPingCommand(context);

      expect(() => ping.fn('unknownhost')).toThrow('ping: unknownhost: Name or service not known');
    });
  });

  describe('async output structure', () => {
    it('should return AsyncOutput object', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);

      const result = ping.fn('192.168.1.50');

      expect(isAsyncOutput(result)).toBe(true);
    });

    it('should have start function', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);

      const result = ping.fn('192.168.1.50');

      if (isAsyncOutput(result)) {
        expect(typeof result.start).toBe('function');
      }
    });

    it('should have cancel function', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);

      const result = ping.fn('192.168.1.50');

      if (isAsyncOutput(result)) {
        expect(typeof result.cancel).toBe('function');
      }
    });
  });

  describe('ping execution', () => {
    it('should output header immediately', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);
      const result = ping.fn('192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      expect(lines[0]).toBe('PING 192.168.1.50 (192.168.1.50): 56 data bytes');
    });

    it('should resolve hostname to IP in header', () => {
      const context = createMockPingContext({
        machines: [getMockRemoteMachine({ ip: '192.168.1.50', hostname: 'fileserver' })],
      });
      const ping = createPingCommand(context);
      const result = ping.fn('fileserver');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      expect(lines[0]).toBe('PING fileserver (192.168.1.50): 56 data bytes');
    });

    it('should output ping responses after delay', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);
      const result = ping.fn('192.168.1.50', 2);

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      // Fast-forward first ping delay
      vi.advanceTimersByTime(800);
      expect(lines.some((l) => l.includes('icmp_seq=1'))).toBe(true);

      // Fast-forward second ping delay
      vi.advanceTimersByTime(800);
      expect(lines.some((l) => l.includes('icmp_seq=2'))).toBe(true);
    });

    it('should output statistics after all pings', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);
      const result = ping.fn('192.168.1.50', 1);

      const lines: string[] = [];
      let completed = false;
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {
            completed = true;
          }
        );
      }

      // Fast-forward through ping and stats delay
      vi.advanceTimersByTime(1000);

      expect(lines.some((l) => l.includes('ping statistics'))).toBe(true);
      expect(lines.some((l) => l.includes('packets transmitted'))).toBe(true);
      expect(completed).toBe(true);
    });

    it('should ping localhost successfully', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);
      const result = ping.fn('localhost', 1);

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      expect(lines[0]).toContain('PING localhost (127.0.0.1)');

      vi.advanceTimersByTime(1000);
      expect(lines.some((l) => l.includes('icmp_seq=1'))).toBe(true);
    });

    it('should ping local IP successfully', () => {
      const context = createMockPingContext({ localIP: '192.168.1.100' });
      const ping = createPingCommand(context);
      const result = ping.fn('192.168.1.100', 1);

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      vi.advanceTimersByTime(1000);
      expect(lines.some((l) => l.includes('1 packets transmitted, 1 received'))).toBe(true);
    });

    it('should cancel pending pings', () => {
      const context = createMockPingContext();
      const ping = createPingCommand(context);
      const result = ping.fn('192.168.1.50', 4);

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );

        // Cancel after first ping
        vi.advanceTimersByTime(800);
        result.cancel?.();
        vi.advanceTimersByTime(3000);
      }

      // Should only have header and first ping, no more
      const pingResponses = lines.filter((l) => l.includes('icmp_seq'));
      expect(pingResponses.length).toBe(1);
    });
  });
});

// --- Nslookup Factory Functions ---

const getMockDnsRecord = (overrides?: Partial<DnsRecord>): DnsRecord => ({
  domain: 'gateway.local',
  ip: '192.168.1.1',
  type: 'A',
  ...overrides,
});

type NslookupContextConfig = {
  readonly dnsRecords?: readonly DnsRecord[];
  readonly gateway?: string;
};

const createMockNslookupContext = (config: NslookupContextConfig = {}) => {
  const { dnsRecords = [getMockDnsRecord()], gateway = '192.168.1.1' } = config;

  return {
    resolveDomain: (domain: string) =>
      dnsRecords.find((r) => r.domain.toLowerCase() === domain.toLowerCase()),
    getGateway: () => gateway,
  };
};

// --- Nslookup Tests ---

describe('nslookup command', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error handling', () => {
    it('should throw error when no domain given', () => {
      const context = createMockNslookupContext();
      const nslookup = createNslookupCommand(context);

      expect(() => nslookup.fn()).toThrow('nslookup: missing domain argument');
    });

    it('should throw error when domain is not a string', () => {
      const context = createMockNslookupContext();
      const nslookup = createNslookupCommand(context);

      expect(() => nslookup.fn(123)).toThrow('nslookup: domain must be a string');
    });
  });

  describe('async output structure', () => {
    it('should return AsyncOutput object', () => {
      const context = createMockNslookupContext();
      const nslookup = createNslookupCommand(context);

      const result = nslookup.fn('gateway.local');

      expect(isAsyncOutput(result)).toBe(true);
    });

    it('should have start and cancel functions', () => {
      const context = createMockNslookupContext();
      const nslookup = createNslookupCommand(context);

      const result = nslookup.fn('gateway.local');

      if (isAsyncOutput(result)) {
        expect(typeof result.start).toBe('function');
        expect(typeof result.cancel).toBe('function');
      }
    });
  });

  describe('dns lookup execution', () => {
    it('should show DNS server info immediately', () => {
      const context = createMockNslookupContext({ gateway: '192.168.1.1' });
      const nslookup = createNslookupCommand(context);
      const result = nslookup.fn('gateway.local');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      expect(lines[0]).toBe('Server:  192.168.1.1');
      expect(lines[1]).toBe('Address: 192.168.1.1#53');
    });

    it('should resolve domain to IP after delay', () => {
      const context = createMockNslookupContext({
        dnsRecords: [getMockDnsRecord({ domain: 'fileserver.local', ip: '192.168.1.50' })],
      });
      const nslookup = createNslookupCommand(context);
      const result = nslookup.fn('fileserver.local');

      const lines: string[] = [];
      let completed = false;
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {
            completed = true;
          }
        );
      }

      // Fast-forward DNS lookup delay
      vi.advanceTimersByTime(600);

      expect(lines.some((l) => l.includes('Non-authoritative answer'))).toBe(true);
      expect(lines.some((l) => l.includes('Name:    fileserver.local'))).toBe(true);
      expect(lines.some((l) => l.includes('Address: 192.168.1.50'))).toBe(true);
      expect(completed).toBe(true);
    });

    it('should show NXDOMAIN for unknown domain', () => {
      const context = createMockNslookupContext({
        dnsRecords: [],
      });
      const nslookup = createNslookupCommand(context);
      const result = nslookup.fn('unknown.domain');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      vi.advanceTimersByTime(600);

      expect(lines.some((l) => l.includes("can't find unknown.domain: NXDOMAIN"))).toBe(true);
    });

    it('should be case-insensitive for domain lookup', () => {
      const context = createMockNslookupContext({
        dnsRecords: [getMockDnsRecord({ domain: 'Gateway.Local', ip: '192.168.1.1' })],
      });
      const nslookup = createNslookupCommand(context);
      const result = nslookup.fn('gateway.local');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      vi.advanceTimersByTime(600);

      expect(lines.some((l) => l.includes('Address: 192.168.1.1'))).toBe(true);
    });

    it('should cancel pending lookup', () => {
      const context = createMockNslookupContext();
      const nslookup = createNslookupCommand(context);
      const result = nslookup.fn('gateway.local');

      const lines: string[] = [];
      let completed = false;
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {
            completed = true;
          }
        );

        // Cancel before lookup completes
        vi.advanceTimersByTime(300);
        result.cancel?.();
        vi.advanceTimersByTime(600);
      }

      // Should only have server info, no answer
      expect(lines.some((l) => l.includes('Non-authoritative'))).toBe(false);
      expect(completed).toBe(false);
    });
  });
});

// --- Nmap Factory Functions ---

type NmapContextConfig = {
  readonly machines?: readonly RemoteMachine[];
  readonly localIP?: string;
};

const createMockNmapContext = (config: NmapContextConfig = {}) => {
  const { machines = [], localIP = '192.168.1.100' } = config;

  return {
    getMachine: (ip: string) => machines.find((m) => m.ip === ip),
    getMachines: () => machines,
    getLocalIP: () => localIP,
  };
};

// --- Nmap Tests ---

describe('nmap command', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error handling', () => {
    it('should throw error when no target given', () => {
      const context = createMockNmapContext();
      const nmap = createNmapCommand(context);

      expect(() => nmap.fn()).toThrow('nmap: missing target specification');
    });

    it('should throw error for invalid IP', () => {
      const context = createMockNmapContext();
      const nmap = createNmapCommand(context);

      expect(() => nmap.fn('not-an-ip')).toThrow('nmap: invalid target: not-an-ip');
    });

    it('should throw error for unknown IP outside subnet when start is called', () => {
      const context = createMockNmapContext({ machines: [] });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('10.0.0.1');

      if (isAsyncOutput(result)) {
        expect(() =>
          result.start(
            () => {},
            () => {}
          )
        ).toThrow('nmap: failed to resolve "10.0.0.1"');
      }
    });
  });

  describe('async output structure', () => {
    it('should return AsyncOutput for single IP', () => {
      const context = createMockNmapContext();
      const nmap = createNmapCommand(context);

      const result = nmap.fn('192.168.1.50');

      expect(isAsyncOutput(result)).toBe(true);
    });

    it('should return AsyncOutput for IP range', () => {
      const context = createMockNmapContext();
      const nmap = createNmapCommand(context);

      const result = nmap.fn('192.168.1.1-5');

      expect(isAsyncOutput(result)).toBe(true);
    });

    it('should have start and cancel functions', () => {
      const context = createMockNmapContext();
      const nmap = createNmapCommand(context);

      const result = nmap.fn('192.168.1.1');

      if (isAsyncOutput(result)) {
        expect(typeof result.start).toBe('function');
        expect(typeof result.cancel).toBe('function');
      }
    });
  });

  describe('range scan', () => {
    it('should show header with target and total IPs', () => {
      const context = createMockNmapContext();
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.1-10');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      expect(lines[0]).toBe('Starting Nmap scan on 192.168.1.1-10');
      expect(lines[1]).toBe('Scanning 10 hosts...');
    });

    it('should discover localhost in range', () => {
      const context = createMockNmapContext({ localIP: '192.168.1.100' });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.99-101');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      // Fast-forward through all scans (3 IPs * 150ms)
      vi.advanceTimersByTime(500);

      expect(lines.some((l) => l.includes('192.168.1.100 (localhost)'))).toBe(true);
    });

    it('should discover known machines in range', () => {
      const context = createMockNmapContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'fileserver',
            ports: [{ port: 22, service: 'ssh', open: true }],
          }),
        ],
      });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.49-51');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      vi.advanceTimersByTime(500);

      expect(lines.some((l) => l.includes('192.168.1.50 (fileserver)'))).toBe(true);
    });

    it('should show summary after scan completes', () => {
      const context = createMockNmapContext({
        localIP: '192.168.1.100',
        machines: [getMockRemoteMachine({ ip: '192.168.1.1', hostname: 'gateway' })],
      });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.1-3');

      const lines: string[] = [];
      let completed = false;
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {
            completed = true;
          }
        );
      }

      // Fast-forward through scans + summary delay
      vi.advanceTimersByTime(1000);

      expect(lines.some((l) => l.includes('Scan complete. Summary:'))).toBe(true);
      expect(lines.some((l) => l.includes('3 IP addresses scanned, 1 hosts up'))).toBe(true);
      expect(completed).toBe(true);
    });

    it('should show no hosts found when range is empty', () => {
      const context = createMockNmapContext({ machines: [] });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.200-202');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      vi.advanceTimersByTime(1000);

      expect(lines.some((l) => l.includes('No hosts found in range.'))).toBe(true);
    });

    it('should cancel range scan', () => {
      const context = createMockNmapContext({
        machines: [
          getMockRemoteMachine({ ip: '192.168.1.1', hostname: 'host1' }),
          getMockRemoteMachine({ ip: '192.168.1.5', hostname: 'host5' }),
        ],
      });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.1-10');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );

        // Cancel after first host
        vi.advanceTimersByTime(200);
        result.cancel?.();
        vi.advanceTimersByTime(2000);
      }

      // Should not have summary
      expect(lines.some((l) => l.includes('Scan complete'))).toBe(false);
    });
  });

  describe('single IP port scan', () => {
    it('should show localhost ports as closed', () => {
      const context = createMockNmapContext({ localIP: '192.168.1.100' });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.100');

      const lines: string[] = [];
      let completed = false;
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {
            completed = true;
          }
        );
      }

      vi.advanceTimersByTime(600);

      expect(lines.some((l) => l.includes('All scanned ports are closed'))).toBe(true);
      expect(completed).toBe(true);
    });

    it('should show host down for unknown IP in subnet', () => {
      const context = createMockNmapContext({ machines: [] });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.99');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      vi.advanceTimersByTime(1000);

      expect(lines.some((l) => l.includes('Host seems down'))).toBe(true);
    });

    it('should show port table for known machine', () => {
      const context = createMockNmapContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'fileserver',
            ports: [
              { port: 22, service: 'ssh', open: true },
              { port: 80, service: 'http', open: true },
            ],
          }),
        ],
      });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      // Fast-forward through header and port scans
      vi.advanceTimersByTime(2000);

      expect(lines.some((l) => l.includes('fileserver (192.168.1.50)'))).toBe(true);
      expect(lines.some((l) => l.includes('PORT      STATE  SERVICE'))).toBe(true);
      expect(lines.some((l) => l.includes('22/tcp') && l.includes('open') && l.includes('ssh'))).toBe(true);
      expect(lines.some((l) => l.includes('80/tcp') && l.includes('open') && l.includes('http'))).toBe(true);
    });

    it('should only show open ports', () => {
      const context = createMockNmapContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'server',
            ports: [
              { port: 22, service: 'ssh', open: true },
              { port: 23, service: 'telnet', open: false },
            ],
          }),
        ],
      });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      vi.advanceTimersByTime(2000);

      expect(lines.some((l) => l.includes('22/tcp'))).toBe(true);
      expect(lines.some((l) => l.includes('23/tcp'))).toBe(false);
    });

    it('should show all ports closed when no open ports', () => {
      const context = createMockNmapContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'server',
            ports: [{ port: 22, service: 'ssh', open: false }],
          }),
        ],
      });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      vi.advanceTimersByTime(1000);

      expect(lines.some((l) => l.includes('All scanned ports are closed'))).toBe(true);
    });

    it('should cancel port scan', () => {
      const context = createMockNmapContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'server',
            ports: [
              { port: 22, service: 'ssh', open: true },
              { port: 80, service: 'http', open: true },
              { port: 443, service: 'https', open: true },
            ],
          }),
        ],
      });
      const nmap = createNmapCommand(context);
      const result = nmap.fn('192.168.1.50');

      const lines: string[] = [];
      let completed = false;
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {
            completed = true;
          }
        );

        // Cancel before all ports scanned
        vi.advanceTimersByTime(600);
        result.cancel?.();
        vi.advanceTimersByTime(2000);
      }

      expect(completed).toBe(false);
    });
  });
});

// --- SSH Factory Functions ---

type SshContextConfig = {
  readonly machines?: readonly RemoteMachine[];
  readonly localIP?: string;
};

const createMockSshContext = (config: SshContextConfig = {}) => {
  const { machines = [], localIP = '192.168.1.100' } = config;

  return {
    getMachine: (ip: string) => machines.find((m) => m.ip === ip),
    getLocalIP: () => localIP,
  };
};

const isSshPrompt = (value: unknown): value is SshPromptData =>
  typeof value === 'object' &&
  value !== null &&
  '__type' in value &&
  (value as SshPromptData).__type === 'ssh_prompt';

// --- SSH Tests ---

describe('ssh command', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error handling', () => {
    it('should throw error when no username given', () => {
      const context = createMockSshContext();
      const ssh = createSshCommand(context);

      expect(() => ssh.fn()).toThrow('ssh: missing username');
    });

    it('should throw error when no host given', () => {
      const context = createMockSshContext();
      const ssh = createSshCommand(context);

      expect(() => ssh.fn('admin')).toThrow('ssh: missing host');
    });

    it('should throw error when connecting to localhost IP', () => {
      const context = createMockSshContext({ localIP: '192.168.1.100' });
      const ssh = createSshCommand(context);

      expect(() => ssh.fn('user', '192.168.1.100')).toThrow(
        'ssh: cannot connect to localhost via SSH'
      );
    });

    it('should throw error when connecting to 127.0.0.1', () => {
      const context = createMockSshContext();
      const ssh = createSshCommand(context);

      expect(() => ssh.fn('user', '127.0.0.1')).toThrow(
        'ssh: cannot connect to localhost via SSH'
      );
    });

    it('should throw error when connecting to localhost hostname', () => {
      const context = createMockSshContext();
      const ssh = createSshCommand(context);

      expect(() => ssh.fn('user', 'localhost')).toThrow(
        'ssh: cannot connect to localhost via SSH'
      );
    });

    it('should throw error when machine does not exist', () => {
      const context = createMockSshContext({ machines: [] });
      const ssh = createSshCommand(context);

      expect(() => ssh.fn('admin', '10.0.0.1')).toThrow(
        'ssh: connect to host 10.0.0.1 port 22: Connection refused'
      );
    });

    it('should throw error when SSH port is not open', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 80, service: 'http', open: true }],
          }),
        ],
      });
      const ssh = createSshCommand(context);

      expect(() => ssh.fn('admin', '192.168.1.50')).toThrow(
        'ssh: connect to host 192.168.1.50 port 22: Connection refused'
      );
    });

    it('should throw error when SSH port exists but is closed', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: false }],
          }),
        ],
      });
      const ssh = createSshCommand(context);

      expect(() => ssh.fn('admin', '192.168.1.50')).toThrow(
        'ssh: connect to host 192.168.1.50 port 22: Connection refused'
      );
    });

    it('should throw error when user does not exist on remote machine', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'root', passwordHash: 'abc', userType: 'root' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);

      expect(() => ssh.fn('nobody', '192.168.1.50')).toThrow(
        'ssh: nobody@192.168.1.50: Permission denied (publickey,password)'
      );
    });
  });

  describe('async output structure', () => {
    it('should return AsyncOutput object', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);

      const result = ssh.fn('admin', '192.168.1.50');

      expect(isAsyncOutput(result)).toBe(true);
    });

    it('should have start function', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);

      const result = ssh.fn('admin', '192.168.1.50');

      if (isAsyncOutput(result)) {
        expect(typeof result.start).toBe('function');
      }
    });

    it('should have cancel function', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);

      const result = ssh.fn('admin', '192.168.1.50');

      if (isAsyncOutput(result)) {
        expect(typeof result.cancel).toBe('function');
      }
    });
  });

  describe('connection execution', () => {
    it('should output connecting message immediately', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);
      const result = ssh.fn('admin', '192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      expect(lines[0]).toBe('Connecting to 192.168.1.50...');
    });

    it('should output SSH version after first delay', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);
      const result = ssh.fn('admin', '192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      // Fast-forward first delay (SSH_CONNECT_DELAY_MS = 800)
      vi.advanceTimersByTime(800);

      expect(lines.some((l) => l.includes('SSH-2.0-OpenSSH'))).toBe(true);
    });

    it('should output authenticating message after handshake delay', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);
      const result = ssh.fn('admin', '192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      // Fast-forward both delays (800 + 600 = 1400ms)
      vi.advanceTimersByTime(1400);

      expect(lines.some((l) => l.includes('Authenticating as admin'))).toBe(true);
    });

    it('should complete with SSH prompt data for password mode', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);
      const result = ssh.fn('admin', '192.168.1.50');

      let followUp: unknown = null;
      if (isAsyncOutput(result)) {
        result.start(
          () => {},
          (data) => {
            followUp = data;
          }
        );
      }

      // Fast-forward to completion
      vi.advanceTimersByTime(1400);

      expect(isSshPrompt(followUp)).toBe(true);
      if (isSshPrompt(followUp)) {
        expect(followUp.targetUser).toBe('admin');
        expect(followUp.targetIP).toBe('192.168.1.50');
      }
    });

    it('should include correct user in SSH prompt', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [
              { username: 'root', passwordHash: 'abc', userType: 'root' },
              { username: 'guest', passwordHash: 'def', userType: 'guest' },
            ],
          }),
        ],
      });
      const ssh = createSshCommand(context);
      const result = ssh.fn('root', '192.168.1.50');

      let followUp: unknown = null;
      if (isAsyncOutput(result)) {
        result.start(
          () => {},
          (data) => {
            followUp = data;
          }
        );
      }

      vi.advanceTimersByTime(1400);

      if (isSshPrompt(followUp)) {
        expect(followUp.targetUser).toBe('root');
      }
    });
  });

  describe('cancellation', () => {
    it('should cancel before SSH version output', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);
      const result = ssh.fn('admin', '192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );

        // Cancel before first delay completes
        vi.advanceTimersByTime(400);
        result.cancel?.();
        vi.advanceTimersByTime(2000);
      }

      // Should only have connecting message
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('Connecting to 192.168.1.50...');
    });

    it('should cancel before authentication prompt', () => {
      const context = createMockSshContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
            users: [{ username: 'admin', passwordHash: 'abc', userType: 'user' }],
          }),
        ],
      });
      const ssh = createSshCommand(context);
      const result = ssh.fn('admin', '192.168.1.50');

      const lines: string[] = [];
      let completed = false;
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {
            completed = true;
          }
        );

        // Advance past first delay, then cancel
        vi.advanceTimersByTime(900);
        result.cancel?.();
        vi.advanceTimersByTime(2000);
      }

      // Should have connecting and SSH version, but not authentication
      expect(lines.some((l) => l.includes('Authenticating'))).toBe(false);
      expect(completed).toBe(false);
    });
  });
});

// --- FTP Factory Functions ---

type FtpContextConfig = {
  readonly machines?: readonly RemoteMachine[];
  readonly localIP?: string;
  readonly dnsRecords?: readonly DnsRecord[];
};

const createMockFtpContext = (config: FtpContextConfig = {}) => {
  const { machines = [], localIP = '192.168.1.100', dnsRecords = [] } = config;

  return {
    getMachine: (ip: string) => machines.find((m) => m.ip === ip),
    getLocalIP: () => localIP,
    resolveDomain: (domain: string) =>
      dnsRecords.find((r) => r.domain.toLowerCase() === domain.toLowerCase()),
  };
};

const isFtpPrompt = (value: unknown): value is FtpPromptData =>
  typeof value === 'object' &&
  value !== null &&
  '__type' in value &&
  (value as FtpPromptData).__type === 'ftp_prompt';

// --- FTP Tests ---

describe('ftp command', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('error handling', () => {
    it('should throw error when no host given', () => {
      const context = createMockFtpContext();
      const ftp = createFtpCommand(context);

      expect(() => ftp.fn()).toThrow('ftp: missing host');
    });

    it('should throw error for unknown hostname', () => {
      const context = createMockFtpContext({ dnsRecords: [] });
      const ftp = createFtpCommand(context);

      expect(() => ftp.fn('unknown.host')).toThrow(
        'ftp: unknown.host: Name or service not known'
      );
    });

    it('should throw error when connecting to localhost IP', () => {
      const context = createMockFtpContext({ localIP: '192.168.1.100' });
      const ftp = createFtpCommand(context);

      expect(() => ftp.fn('192.168.1.100')).toThrow(
        'ftp: cannot connect to localhost via FTP'
      );
    });

    it('should throw error when connecting to 127.0.0.1', () => {
      const context = createMockFtpContext();
      const ftp = createFtpCommand(context);

      expect(() => ftp.fn('127.0.0.1')).toThrow(
        'ftp: cannot connect to localhost via FTP'
      );
    });

    it('should throw error when connecting to localhost hostname', () => {
      // When 'localhost' is passed, it's treated as a hostname that needs DNS resolution
      // Since there's no DNS record for 'localhost', it fails with name resolution error
      const context = createMockFtpContext();
      const ftp = createFtpCommand(context);

      expect(() => ftp.fn('localhost')).toThrow(
        'ftp: localhost: Name or service not known'
      );
    });

    it('should throw error when machine does not exist', () => {
      const context = createMockFtpContext({ machines: [] });
      const ftp = createFtpCommand(context);

      expect(() => ftp.fn('10.0.0.1')).toThrow(
        'ftp: connect to 10.0.0.1 port 21: Connection refused'
      );
    });

    it('should throw error when FTP port is not open', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 22, service: 'ssh', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);

      expect(() => ftp.fn('192.168.1.50')).toThrow(
        'ftp: connect to 192.168.1.50 port 21: Connection refused'
      );
    });

    it('should throw error when FTP port exists but is closed', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: false }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);

      expect(() => ftp.fn('192.168.1.50')).toThrow(
        'ftp: connect to 192.168.1.50 port 21: Connection refused'
      );
    });
  });

  describe('hostname resolution', () => {
    it('should resolve hostname to IP address', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'fileserver',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
        dnsRecords: [getMockDnsRecord({ domain: 'fileserver.local', ip: '192.168.1.50' })],
      });
      const ftp = createFtpCommand(context);

      const result = ftp.fn('fileserver.local');

      expect(isAsyncOutput(result)).toBe(true);
    });

    it('should use resolved IP for connection message', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'fileserver',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
        dnsRecords: [getMockDnsRecord({ domain: 'fileserver.local', ip: '192.168.1.50' })],
      });
      const ftp = createFtpCommand(context);
      const result = ftp.fn('fileserver.local');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      expect(lines[0]).toBe('Connecting to 192.168.1.50...');
    });

    it('should be case-insensitive for hostname lookup', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
        dnsRecords: [getMockDnsRecord({ domain: 'FileServer.Local', ip: '192.168.1.50' })],
      });
      const ftp = createFtpCommand(context);

      const result = ftp.fn('fileserver.local');

      expect(isAsyncOutput(result)).toBe(true);
    });
  });

  describe('async output structure', () => {
    it('should return AsyncOutput object', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);

      const result = ftp.fn('192.168.1.50');

      expect(isAsyncOutput(result)).toBe(true);
    });

    it('should have start function', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);

      const result = ftp.fn('192.168.1.50');

      if (isAsyncOutput(result)) {
        expect(typeof result.start).toBe('function');
      }
    });

    it('should have cancel function', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);

      const result = ftp.fn('192.168.1.50');

      if (isAsyncOutput(result)) {
        expect(typeof result.cancel).toBe('function');
      }
    });
  });

  describe('connection execution', () => {
    it('should output connecting message immediately', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);
      const result = ftp.fn('192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      expect(lines[0]).toBe('Connecting to 192.168.1.50...');
    });

    it('should output connected message after first delay', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);
      const result = ftp.fn('192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      // Fast-forward first delay (FTP_CONNECT_DELAY_MS = 600)
      vi.advanceTimersByTime(600);

      expect(lines.some((l) => l === 'Connected to 192.168.1.50.')).toBe(true);
    });

    it('should output FTP banner with hostname after banner delay', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'fileserver',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);
      const result = ftp.fn('192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );
      }

      // Fast-forward both delays (600 + 400 = 1000ms)
      vi.advanceTimersByTime(1000);

      expect(lines.some((l) => l.includes('220 Welcome to fileserver FTP server'))).toBe(true);
    });

    it('should complete with FTP prompt data', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);
      const result = ftp.fn('192.168.1.50');

      let followUp: unknown = null;
      if (isAsyncOutput(result)) {
        result.start(
          () => {},
          (data) => {
            followUp = data;
          }
        );
      }

      // Fast-forward to completion
      vi.advanceTimersByTime(1000);

      expect(isFtpPrompt(followUp)).toBe(true);
      if (isFtpPrompt(followUp)) {
        expect(followUp.targetIP).toBe('192.168.1.50');
      }
    });

    it('should include resolved IP in FTP prompt data', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'fileserver',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
        dnsRecords: [getMockDnsRecord({ domain: 'fileserver.local', ip: '192.168.1.50' })],
      });
      const ftp = createFtpCommand(context);
      const result = ftp.fn('fileserver.local');

      let followUp: unknown = null;
      if (isAsyncOutput(result)) {
        result.start(
          () => {},
          (data) => {
            followUp = data;
          }
        );
      }

      vi.advanceTimersByTime(1000);

      if (isFtpPrompt(followUp)) {
        expect(followUp.targetIP).toBe('192.168.1.50');
      }
    });
  });

  describe('cancellation', () => {
    it('should cancel before connected message', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);
      const result = ftp.fn('192.168.1.50');

      const lines: string[] = [];
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {}
        );

        // Cancel before first delay completes
        vi.advanceTimersByTime(300);
        result.cancel?.();
        vi.advanceTimersByTime(2000);
      }

      // Should only have connecting message
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('Connecting to 192.168.1.50...');
    });

    it('should cancel before FTP banner', () => {
      const context = createMockFtpContext({
        machines: [
          getMockRemoteMachine({
            ip: '192.168.1.50',
            hostname: 'fileserver',
            ports: [{ port: 21, service: 'ftp', open: true }],
          }),
        ],
      });
      const ftp = createFtpCommand(context);
      const result = ftp.fn('192.168.1.50');

      const lines: string[] = [];
      let completed = false;
      if (isAsyncOutput(result)) {
        result.start(
          (line) => lines.push(line),
          () => {
            completed = true;
          }
        );

        // Advance past first delay, then cancel
        vi.advanceTimersByTime(700);
        result.cancel?.();
        vi.advanceTimersByTime(2000);
      }

      // Should have connecting and connected, but not banner
      expect(lines.some((l) => l.includes('220 Welcome'))).toBe(false);
      expect(completed).toBe(false);
    });
  });
});
