import type { Command, AsyncOutput, SshPromptData } from '../components/Terminal/types';
import type { RemoteMachine } from '../network/types';

type SshContext = {
  readonly getMachine: (ip: string) => RemoteMachine | undefined;
  readonly getLocalIP: () => string;
};

// Delays for SSH connection simulation
const SSH_CONNECT_DELAY_MS = 800;
const SSH_HANDSHAKE_DELAY_MS = 600;

export const createSshCommand = (context: SshContext): Command => ({
  name: 'ssh',
  description: 'Secure shell connection to remote host',
  manual: {
    synopsis: 'ssh(user: string, host: string)',
    description:
      'Connect to a remote machine via SSH. You will be prompted for the password. The connection will only succeed if the remote machine has SSH (port 22) open and the credentials are valid.',
    arguments: [
      { name: 'user', description: 'Username to authenticate as', required: true },
      { name: 'host', description: 'IP address of the remote machine', required: true },
    ],
    examples: [
      { command: 'ssh("root", "192.168.1.50")', description: 'Connect to fileserver as root' },
      { command: 'ssh("admin", "192.168.1.1")', description: 'Connect to gateway as admin' },
    ],
  },
  fn: (...args: unknown[]): AsyncOutput => {
    const { getMachine, getLocalIP } = context;

    const user = args[0] as string | undefined;
    const host = args[1] as string | undefined;

    if (!user) {
      throw new Error('ssh: missing username\nUsage: ssh("user", "host")');
    }

    if (!host) {
      throw new Error('ssh: missing host\nUsage: ssh("user", "host")');
    }

    // Check if trying to SSH to localhost
    const localIP = getLocalIP();
    if (host === localIP || host === '127.0.0.1' || host === 'localhost') {
      throw new Error('ssh: cannot connect to localhost via SSH');
    }

    // Check if machine exists
    const machine = getMachine(host);
    if (!machine) {
      throw new Error(`ssh: connect to host ${host} port 22: Connection refused`);
    }

    // Check if SSH port is open
    const sshPort = machine.ports.find(p => p.port === 22 && p.service === 'ssh');
    if (!sshPort || !sshPort.open) {
      throw new Error(`ssh: connect to host ${host} port 22: Connection refused`);
    }

    // Check if user exists on remote machine
    const remoteUser = machine.users.find(u => u.username === user);
    if (!remoteUser) {
      throw new Error(`ssh: ${user}@${host}: Permission denied (publickey,password)`);
    }

    let cancelled = false;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    return {
      __type: 'async',
      start: (onLine, onComplete) => {
        // Show connection progress
        onLine(`Connecting to ${host}...`);

        const connectTimeoutId = setTimeout(() => {
          if (cancelled) return;

          onLine(`SSH-2.0-OpenSSH_8.9`);

          const handshakeTimeoutId = setTimeout(() => {
            if (cancelled) return;

            onLine(`Authenticating as ${user}...`);

            // Complete with SSH prompt data to trigger password mode
            const sshPrompt: SshPromptData = {
              __type: 'ssh_prompt',
              targetUser: user,
              targetIP: host,
            };

            onComplete(sshPrompt);
          }, SSH_HANDSHAKE_DELAY_MS);

          timeoutIds.push(handshakeTimeoutId);
        }, SSH_CONNECT_DELAY_MS);

        timeoutIds.push(connectTimeoutId);
      },
      cancel: () => {
        cancelled = true;
        timeoutIds.forEach(id => clearTimeout(id));
      },
    };
  },
});
