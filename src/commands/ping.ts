import type { Command, AsyncOutput } from '../components/Terminal/types';
import type { RemoteMachine } from '../network/types';
import { isValidIP } from '../utils/network';

interface PingContext {
  readonly getMachine: (ip: string) => RemoteMachine | undefined;
  readonly getMachines: () => readonly RemoteMachine[];
  readonly getLocalIP: () => string;
}

const generateLatency = (): number => {
  // Generate realistic LAN latency (0.5ms to 5ms)
  return Math.random() * 4.5 + 0.5;
};

const formatPingResponse = (ip: string, seq: number, ttl: number, time: number): string => {
  return `64 bytes from ${ip}: icmp_seq=${seq} ttl=${ttl} time=${time.toFixed(2)} ms`;
};

// Delay between ping responses (simulates real network timing)
const PING_DELAY_MS = 800;

export const createPingCommand = (context: PingContext): Command => ({
  name: 'ping',
  description: 'Send ICMP echo request to network host',
  manual: {
    synopsis: 'ping(host: string, [count: number])',
    description:
      'Send ICMP ECHO_REQUEST packets to a network host to test connectivity. By default sends 4 packets. The host can be an IP address or hostname of a known machine on the network.',
    arguments: [
      { name: 'host', description: 'IP address or hostname to ping', required: true },
      { name: 'count', description: 'Number of packets to send (default: 4)', required: false },
    ],
    examples: [
      { command: 'ping("192.168.1.1")', description: 'Ping the gateway' },
      { command: 'ping("fileserver")', description: 'Ping by hostname' },
      { command: 'ping("192.168.1.50", 2)', description: 'Send only 2 packets' },
    ],
  },
  fn: (...args: unknown[]): AsyncOutput | string => {
    const { getMachine, getMachines, getLocalIP } = context;

    const host = args[0] as string | undefined;
    const count = (args[1] as number | undefined) ?? 4;

    if (!host) {
      throw new Error('ping: missing host operand');
    }

    if (count < 1 || count > 10) {
      throw new Error('ping: count must be between 1 and 10');
    }

    const localIP = getLocalIP();
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === localIP;

    // Find machine by IP or hostname
    const machines = getMachines();
    let targetMachine: RemoteMachine | undefined;
    let targetIP: string;

    if (isLocalhost) {
      targetIP = host === 'localhost' ? '127.0.0.1' : host;
    } else {
      const isIP = isValidIP(host);
      if (isIP) {
        targetMachine = getMachine(host);
        targetIP = host;
      } else {
        targetMachine = machines.find(m => m.hostname === host);
        targetIP = targetMachine?.ip ?? host;
      }

      // Check for unknown host (not localhost, not a known machine)
      if (!targetMachine && !isValidIP(host)) {
        throw new Error(`ping: ${host}: Name or service not known`);
      }
    }

    // Track if cancelled
    let cancelled = false;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    return {
      __type: 'async',
      start: (onLine, onComplete) => {
        const times: number[] = [];
        let totalTime = 0;
        let received = 0;

        // Show header immediately
        onLine(`PING ${host} (${targetIP}): 56 data bytes`);

        // Schedule ping responses
        for (let i = 0; i < count; i++) {
          const timeoutId = setTimeout(() => {
            if (cancelled) return;

            // Unknown IP in subnet = packet loss
            if (!isLocalhost && !targetMachine && targetIP.startsWith('192.168.1.')) {
              // Packet lost, don't output anything for this one
            } else {
              const time = isLocalhost ? generateLatency() * 0.1 : generateLatency();
              times.push(time);
              totalTime += time;
              received++;
              onLine(formatPingResponse(targetIP, i + 1, 64, time));
            }

            // After last ping, show statistics
            if (i === count - 1) {
              const statsTimeoutId = setTimeout(() => {
                if (cancelled) return;

                onLine('');
                onLine(`--- ${host} ping statistics ---`);

                const packetLoss = Math.round(((count - received) / count) * 100);
                onLine(`${count} packets transmitted, ${received} received, ${packetLoss}% packet loss`);

                if (received > 0) {
                  const minTime = Math.min(...times);
                  const maxTime = Math.max(...times);
                  const avgTime = totalTime / received;
                  onLine(`rtt min/avg/max = ${minTime.toFixed(2)}/${avgTime.toFixed(2)}/${maxTime.toFixed(2)} ms`);
                }

                onComplete();
              }, 200);
              timeoutIds.push(statsTimeoutId);
            }
          }, (i + 1) * PING_DELAY_MS);
          timeoutIds.push(timeoutId);
        }
      },
      cancel: () => {
        cancelled = true;
        timeoutIds.forEach(id => clearTimeout(id));
      },
    };
  },
});
