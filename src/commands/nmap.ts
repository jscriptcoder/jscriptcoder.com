import type { Command, AsyncOutput } from '../components/Terminal/types';
import type { RemoteMachine } from '../network/types';
import { isValidIP, parseIPRange } from '../utils/network';
import { createCancellationToken } from '../utils/asyncCommand';

type NmapContext = {
  readonly getMachine: (ip: string) => RemoteMachine | undefined;
  readonly getMachines: () => readonly RemoteMachine[];
  readonly getLocalIP: () => string;
};

const SCAN_DELAY_MS = 150;
const PORT_SCAN_DELAY_MS = 300;

export const createNmapCommand = (context: NmapContext): Command => ({
  name: 'nmap',
  description: 'Network exploration and port scanning',
  manual: {
    synopsis: 'nmap(target: string)',
    description:
      'Nmap ("Network Mapper") is a utility for network exploration and security auditing. It can discover hosts on a network and determine what services they are running. Use a single IP to scan ports on that host, or use a range (e.g., "192.168.1.1-254") to discover live hosts.',
    arguments: [
      {
        name: 'target',
        description: 'IP address or range to scan (e.g., "192.168.1.1" or "192.168.1.1-254")',
        required: true,
      },
    ],
    examples: [
      { command: 'nmap("192.168.1.1")', description: 'Scan ports on a single host' },
      { command: 'nmap("192.168.1.1-254")', description: 'Discover hosts in IP range' },
    ],
  },
  fn: (...args: unknown[]): AsyncOutput => {
    const { getMachine, getMachines, getLocalIP } = context;

    const target = args[0] as string | undefined;

    if (!target) {
      throw new Error('nmap: missing target specification');
    }

    const range = parseIPRange(target);

    if (range) {
      const token = createCancellationToken();

      return {
        __type: 'async',
        start: (onLine, onComplete) => {
          const machines = getMachines();
          const localIP = getLocalIP();
          const totalIPs = range.end - range.start + 1;

          onLine(`Starting Nmap scan on ${target}`);
          onLine(`Scanning ${totalIPs} hosts...`);
          onLine('');

          const foundHosts: string[] = [];
          let scannedCount = 0;

          for (let i = range.start; i <= range.end; i++) {
            const index = i - range.start;
            token.schedule(() => {
              if (token.isCancelled()) return;

              const ip = `${range.baseIP}.${i}`;
              scannedCount++;

              if (ip === localIP) {
                foundHosts.push(`${ip} - localhost (this machine)`);
                onLine(`Host discovered: ${ip} (localhost)`);
              } else {
                const machine = machines.find((m) => m.ip === ip);
                if (machine) {
                  const openPorts = machine.ports.filter((p) => p.open);
                  const services = openPorts.map((p) => p.service).join(', ');
                  foundHosts.push(`${ip} - ${machine.hostname} (${services || 'no open ports'})`);
                  onLine(`Host discovered: ${ip} (${machine.hostname})`);
                }
              }

              if (scannedCount === totalIPs) {
                token.schedule(() => {
                  if (token.isCancelled()) return;

                  onLine('');
                  if (foundHosts.length === 0) {
                    onLine('No hosts found in range.');
                  } else {
                    onLine('Scan complete. Summary:');
                    foundHosts.forEach((host) => onLine(`  ${host}`));
                  }
                  onLine('');
                  onLine(
                    `Nmap done: ${totalIPs} IP addresses scanned, ${foundHosts.length} hosts up`,
                  );
                  onComplete();
                }, 300);
              }
            }, index * SCAN_DELAY_MS);
          }
        },
        cancel: token.cancel,
      };
    }

    if (!isValidIP(target)) {
      throw new Error(`nmap: invalid target: ${target}`);
    }

    const localIP = getLocalIP();
    const token = createCancellationToken();

    return {
      __type: 'async',
      start: (onLine, onComplete) => {
        if (target === localIP || target === '127.0.0.1') {
          onLine(`Starting Nmap scan on ${target}`);
          token.schedule(() => {
            if (token.isCancelled()) return;
            onLine('');
            onLine(`Nmap scan report for localhost (${target})`);
            onLine('Host is up.');
            onLine('');
            onLine('All scanned ports are closed on this machine.');
            onComplete();
          }, 500);
          return;
        }

        const machine = getMachine(target);

        if (!machine) {
          if (target.startsWith('192.168.1.')) {
            onLine(`Starting Nmap scan on ${target}`);
            token.schedule(() => {
              if (token.isCancelled()) return;
              onLine('');
              onLine(`Nmap scan report for ${target}`);
              onLine('Host seems down.');
              onLine('');
              onLine('Note: Host may be blocking ping probes.');
              onComplete();
            }, 800);
            return;
          }
          throw new Error(`nmap: failed to resolve "${target}"`);
        }

        const openPorts = machine.ports.filter((p) => p.open);

        onLine(`Starting Nmap scan on ${target}`);
        onLine('Scanning ports...');

        token.schedule(() => {
          if (token.isCancelled()) return;
          onLine('');
          onLine(`Nmap scan report for ${machine.hostname} (${machine.ip})`);
          onLine('Host is up.');
          onLine('');
          onLine('PORT      STATE  SERVICE');
        }, 400);

        if (openPorts.length === 0) {
          token.schedule(() => {
            if (token.isCancelled()) return;
            onLine('All scanned ports are closed.');
            onComplete();
          }, 600);
        } else {
          openPorts.forEach((port, index) => {
            token.schedule(
              () => {
                if (token.isCancelled()) return;
                const portStr = `${port.port}/tcp`.padEnd(10);
                onLine(`${portStr}open   ${port.service}`);

                if (index === openPorts.length - 1) {
                  token.schedule(() => {
                    if (token.isCancelled()) return;
                    onComplete();
                  }, 200);
                }
              },
              500 + (index + 1) * PORT_SCAN_DELAY_MS,
            );
          });
        }
      },
      cancel: token.cancel,
    };
  },
});
