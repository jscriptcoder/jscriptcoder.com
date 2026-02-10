import type { Command, AsyncOutput, NcPromptData } from '../components/Terminal/types';
import type { RemoteMachine, DnsRecord } from '../network/types';

type NcContext = {
  readonly getMachine: (ip: string) => RemoteMachine | undefined;
  readonly getLocalIP: () => string;
  readonly resolveDomain: (domain: string) => DnsRecord | undefined;
};

const NC_CONNECT_DELAY_MS = 400;
const NC_BANNER_DELAY_MS = 300;

// Service banners for different port types (null means interactive mode)
const SERVICE_BANNERS: Readonly<Record<string, string | null>> = {
  ssh: 'SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.1',
  http: 'HTTP/1.1 400 Bad Request\r\nConnection: close',
  'http-alt': 'HTTP/1.1 400 Bad Request\r\nConnection: close',
  https: '(binary SSL/TLS data)',
  ftp: '220 FTP server ready.',
  mysql: '(binary MySQL protocol data)',
  elite: null, // Special handling - enters interactive mode
};

// Interactive services have an owner defined in the port config
import type { Port } from '../network/types';

// Check if port is interactive (has an owner)
const isInteractivePort = (port: Port): boolean => port.owner !== undefined;

export const createNcCommand = (context: NcContext): Command => ({
  name: 'nc',
  description: 'Netcat - arbitrary TCP connections',
  manual: {
    synopsis: 'nc(host: string, port: number)',
    description:
      'Connect to a remote host on the specified port. ' +
      'Netcat opens a raw TCP connection and displays any data received from the remote host. ' +
      'For certain services (like backdoors), you can interact with the remote service.',
    arguments: [
      { name: 'host', description: 'IP address or hostname of the remote machine', required: true },
      { name: 'port', description: 'Port number to connect to', required: true },
    ],
    examples: [
      { command: 'nc("192.168.1.50", 21)', description: 'Connect to FTP port and see banner' },
      { command: 'nc("203.0.113.42", 31337)', description: 'Connect to backdoor service' },
      { command: 'nc("darknet.ctf", 8080)', description: 'Connect using hostname' },
    ],
  },
  fn: (...args: unknown[]): AsyncOutput => {
    const { getMachine, getLocalIP, resolveDomain } = context;

    const host = args[0] as string | undefined;
    const port = args[1] as number | undefined;

    if (!host) {
      throw new Error('nc: missing host\nUsage: nc("host", port)');
    }

    if (port === undefined || typeof port !== 'number') {
      throw new Error('nc: missing or invalid port\nUsage: nc("host", port)');
    }

    if (port < 1 || port > 65535) {
      throw new Error('nc: port must be between 1 and 65535');
    }

    // Resolve hostname to IP if needed
    let targetIP = host;
    if (!host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const record = resolveDomain(host);
      if (!record) {
        throw new Error(`nc: ${host}: Name or service not known`);
      }
      targetIP = record.ip;
    }

    // Check if trying to connect to localhost
    const localIP = getLocalIP();
    if (targetIP === localIP || targetIP === '127.0.0.1' || host === 'localhost') {
      throw new Error('nc: connect to localhost: Connection refused');
    }

    // Check if machine exists
    const machine = getMachine(targetIP);
    if (!machine) {
      throw new Error(`nc: connect to ${targetIP} port ${port}: Connection timed out`);
    }

    // Check if port is open
    const targetPort = machine.ports.find((p) => p.port === port);
    if (!targetPort || !targetPort.open) {
      throw new Error(`nc: connect to ${targetIP} port ${port}: Connection refused`);
    }

    let cancelled = false;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    return {
      __type: 'async',
      start: (onLine, onComplete) => {
        onLine(`Connecting to ${targetIP}:${port}...`);

        const connectTimeoutId = setTimeout(() => {
          if (cancelled) return;

          onLine(`Connected to ${targetIP}.`);

          const bannerTimeoutId = setTimeout(() => {
            if (cancelled) return;

            const service = targetPort.service;

            // Check if this is an interactive port (has owner)
            if (isInteractivePort(targetPort) && targetPort.owner) {
              const { username, userType, homePath } = targetPort.owner;

              onLine('');
              onLine(`# ${port} #`);
              onLine('');

              // Return nc prompt data to enter interactive mode
              const ncPrompt: NcPromptData = {
                __type: 'nc_prompt',
                targetIP,
                targetPort: port,
                service,
                username,
                userType,
                homePath,
              };

              onComplete(ncPrompt);
            } else {
              // Non-interactive service - just show banner and close
              const banner = SERVICE_BANNERS[service] ?? `Connected to ${service} service`;
              onLine(banner);
              onLine('');
              onLine('Connection closed.');
              onComplete();
            }
          }, NC_BANNER_DELAY_MS);

          timeoutIds.push(bannerTimeoutId);
        }, NC_CONNECT_DELAY_MS);

        timeoutIds.push(connectTimeoutId);
      },
      cancel: () => {
        cancelled = true;
        timeoutIds.forEach((id) => clearTimeout(id));
      },
    };
  },
});
