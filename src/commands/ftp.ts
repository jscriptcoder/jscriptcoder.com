import type { Command, AsyncOutput, FtpPromptData } from '../components/Terminal/types';
import type { RemoteMachine, DnsRecord } from '../network/types';

type FtpContext = {
  readonly getMachine: (ip: string) => RemoteMachine | undefined;
  readonly getLocalIP: () => string;
  readonly resolveDomain: (domain: string) => DnsRecord | undefined;
};

const FTP_CONNECT_DELAY_MS = 600;
const FTP_BANNER_DELAY_MS = 400;

export const createFtpCommand = (context: FtpContext): Command => ({
  name: 'ftp',
  description: 'File Transfer Protocol connection to remote host',
  manual: {
    synopsis: 'ftp(host: string)',
    description:
      'Connect to a remote machine via FTP. You will be prompted for username and password. ' +
      'The connection will only succeed if the remote machine has FTP (port 21) open and the credentials are valid. ' +
      'Once connected, you can use FTP commands: ls(), cd(), pwd(), lpwd(), lcd(), get(), put(), quit().',
    arguments: [
      { name: 'host', description: 'IP address or hostname of the remote machine', required: true },
    ],
    examples: [
      { command: 'ftp("192.168.1.50")', description: 'Connect to fileserver via FTP' },
      { command: 'ftp("fileserver.local")', description: 'Connect using hostname' },
    ],
  },
  fn: (...args: unknown[]): AsyncOutput => {
    const { getMachine, getLocalIP, resolveDomain } = context;

    const host = args[0] as string | undefined;

    if (!host) {
      throw new Error('ftp: missing host\nUsage: ftp("host")');
    }

    // Resolve hostname to IP if needed
    let targetIP = host;
    if (!host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const record = resolveDomain(host);
      if (!record) {
        throw new Error(`ftp: ${host}: Name or service not known`);
      }
      targetIP = record.ip;
    }

    // Check if trying to FTP to localhost
    const localIP = getLocalIP();
    if (targetIP === localIP || targetIP === '127.0.0.1' || host === 'localhost') {
      throw new Error('ftp: cannot connect to localhost via FTP');
    }

    // Check if machine exists
    const machine = getMachine(targetIP);
    if (!machine) {
      throw new Error(`ftp: connect to ${targetIP} port 21: Connection refused`);
    }

    // Check if FTP port is open
    const ftpPort = machine.ports.find(p => p.port === 21 && p.service === 'ftp');
    if (!ftpPort || !ftpPort.open) {
      throw new Error(`ftp: connect to ${targetIP} port 21: Connection refused`);
    }

    let cancelled = false;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    return {
      __type: 'async',
      start: (onLine, onComplete) => {
        onLine(`Connecting to ${targetIP}...`);

        const connectTimeoutId = setTimeout(() => {
          if (cancelled) return;

          onLine(`Connected to ${targetIP}.`);

          const bannerTimeoutId = setTimeout(() => {
            if (cancelled) return;

            onLine(`220 Welcome to ${machine.hostname} FTP server.`);

            // Return FTP prompt data to trigger username/password flow
            const ftpPrompt: FtpPromptData = {
              __type: 'ftp_prompt',
              targetIP,
            };

            onComplete(ftpPrompt);
          }, FTP_BANNER_DELAY_MS);

          timeoutIds.push(bannerTimeoutId);
        }, FTP_CONNECT_DELAY_MS);

        timeoutIds.push(connectTimeoutId);
      },
      cancel: () => {
        cancelled = true;
        timeoutIds.forEach(id => clearTimeout(id));
      },
    };
  },
});
