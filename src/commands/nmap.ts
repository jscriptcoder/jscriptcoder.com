import type { Command } from '../components/Terminal/types';
import type { RemoteMachine } from '../network/types';
import { isValidIP, parseIPRange } from '../utils/network';

interface NmapContext {
  getMachine: (ip: string) => RemoteMachine | undefined;
  getMachines: () => RemoteMachine[];
  getLocalIP: () => string;
}

const formatPortScan = (machine: RemoteMachine): string => {
  const lines: string[] = [
    `Nmap scan report for ${machine.hostname} (${machine.ip})`,
    'Host is up.',
    '',
    'PORT      STATE  SERVICE',
  ];

  const openPorts = machine.ports.filter(p => p.open);

  if (openPorts.length === 0) {
    lines.push('All scanned ports are closed.');
  } else {
    for (const port of openPorts) {
      const portStr = `${port.port}/tcp`.padEnd(10);
      lines.push(`${portStr}open   ${port.service}`);
    }
  }

  return lines.join('\n');
};

export const createNmapCommand = (context: NmapContext): Command => ({
  name: 'nmap',
  description: 'Network exploration and port scanning',
  manual: {
    synopsis: 'nmap(target: string)',
    description:
      'Nmap ("Network Mapper") is a utility for network exploration and security auditing. It can discover hosts on a network and determine what services they are running. Use a single IP to scan ports on that host, or use a range (e.g., "192.168.1.1-254") to discover live hosts.',
    arguments: [
      { name: 'target', description: 'IP address or range to scan (e.g., "192.168.1.1" or "192.168.1.1-254")', required: true },
    ],
    examples: [
      { command: 'nmap("192.168.1.1")', description: 'Scan ports on a single host' },
      { command: 'nmap("192.168.1.1-254")', description: 'Discover hosts in IP range' },
    ],
  },
  fn: (...args: unknown[]): string => {
    const { getMachine, getMachines, getLocalIP } = context;

    const target = args[0] as string | undefined;

    if (!target) {
      throw new Error('nmap: missing target specification');
    }

    // Check if it's a range scan
    const range = parseIPRange(target);

    if (range) {
      // Range scan - discover hosts
      const lines: string[] = [
        `Starting Nmap scan on ${target}`,
        '',
      ];

      const machines = getMachines();
      const localIP = getLocalIP();
      const foundHosts: string[] = [];

      // Check each IP in range
      for (let i = range.start; i <= range.end; i++) {
        const ip = `${range.baseIP}.${i}`;

        // Check if it's localhost
        if (ip === localIP) {
          foundHosts.push(`${ip} - localhost (this machine)`);
          continue;
        }

        // Check if it's a known machine
        const machine = machines.find(m => m.ip === ip);
        if (machine) {
          const openPorts = machine.ports.filter(p => p.open);
          const services = openPorts.map(p => p.service).join(', ');
          foundHosts.push(`${ip} - ${machine.hostname} (${services || 'no open ports'})`);
        }
      }

      if (foundHosts.length === 0) {
        lines.push('No hosts found in range.');
      } else {
        lines.push('Discovered hosts:');
        foundHosts.forEach(host => lines.push(`  ${host}`));
      }

      lines.push('');
      lines.push(`Nmap done: ${range.end - range.start + 1} IP addresses scanned`);

      return lines.join('\n');
    }

    // Single IP scan - port scan
    if (!isValidIP(target)) {
      throw new Error(`nmap: invalid target: ${target}`);
    }

    const localIP = getLocalIP();

    // Check if scanning localhost
    if (target === localIP || target === '127.0.0.1') {
      return [
        `Nmap scan report for localhost (${target})`,
        'Host is up.',
        '',
        'All scanned ports are closed on this machine.',
      ].join('\n');
    }

    const machine = getMachine(target);

    if (!machine) {
      // Check if it's in a valid subnet
      if (target.startsWith('192.168.1.')) {
        return [
          `Nmap scan report for ${target}`,
          'Host seems down.',
          '',
          'Note: Host may be blocking ping probes.',
        ].join('\n');
      }
      throw new Error(`nmap: failed to resolve "${target}"`);
    }

    return formatPortScan(machine);
  },
});
