import type { Command } from '../components/Terminal/types';
import type { RemoteMachine } from '../network/types';

interface PingContext {
  getMachine: (ip: string) => RemoteMachine | undefined;
  getMachines: () => RemoteMachine[];
  getLocalIP: () => string;
}

const generateLatency = (): number => {
  // Generate realistic LAN latency (0.5ms to 5ms)
  return Math.random() * 4.5 + 0.5;
};

const formatPingResponse = (ip: string, seq: number, ttl: number, time: number): string => {
  return `64 bytes from ${ip}: icmp_seq=${seq} ttl=${ttl} time=${time.toFixed(2)} ms`;
};

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
  fn: (...args: unknown[]): string => {
    const { getMachine, getMachines, getLocalIP } = context;

    const host = args[0] as string | undefined;
    const count = (args[1] as number | undefined) ?? 4;

    if (!host) {
      throw new Error('ping: missing host operand');
    }

    if (count < 1 || count > 10) {
      throw new Error('ping: count must be between 1 and 10');
    }

    // Check if pinging localhost
    const localIP = getLocalIP();
    if (host === 'localhost' || host === '127.0.0.1' || host === localIP) {
      const lines: string[] = [`PING ${host} (${host === 'localhost' ? '127.0.0.1' : host}): 56 data bytes`];
      let totalTime = 0;

      for (let i = 0; i < count; i++) {
        const time = generateLatency() * 0.1; // localhost is very fast
        totalTime += time;
        lines.push(formatPingResponse(host === 'localhost' ? '127.0.0.1' : host, i + 1, 64, time));
      }

      lines.push('');
      lines.push(`--- ${host} ping statistics ---`);
      lines.push(`${count} packets transmitted, ${count} received, 0% packet loss`);
      lines.push(`rtt min/avg/max = ${(totalTime / count * 0.5).toFixed(2)}/${(totalTime / count).toFixed(2)}/${(totalTime / count * 1.5).toFixed(2)} ms`);

      return lines.join('\n');
    }

    // Find machine by IP or hostname
    const machines = getMachines();
    let targetMachine: RemoteMachine | undefined;
    let targetIP: string;

    // Check if it's an IP address
    const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

    if (isIP) {
      targetMachine = getMachine(host);
      targetIP = host;
    } else {
      // Search by hostname
      targetMachine = machines.find(m => m.hostname === host);
      targetIP = targetMachine?.ip ?? host;
    }

    if (!targetMachine) {
      // Check if it's in the same subnet but just not a known machine
      if (isIP && host.startsWith('192.168.1.')) {
        return `PING ${host} (${host}): 56 data bytes\n\n--- ${host} ping statistics ---\n${count} packets transmitted, 0 received, 100% packet loss`;
      }
      throw new Error(`ping: ${host}: Name or service not known`);
    }

    // Generate ping responses
    const lines: string[] = [`PING ${host} (${targetIP}): 56 data bytes`];
    let totalTime = 0;
    const times: number[] = [];

    for (let i = 0; i < count; i++) {
      const time = generateLatency();
      times.push(time);
      totalTime += time;
      lines.push(formatPingResponse(targetIP, i + 1, 64, time));
    }

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const avgTime = totalTime / count;

    lines.push('');
    lines.push(`--- ${host} ping statistics ---`);
    lines.push(`${count} packets transmitted, ${count} received, 0% packet loss`);
    lines.push(`rtt min/avg/max = ${minTime.toFixed(2)}/${avgTime.toFixed(2)}/${maxTime.toFixed(2)} ms`);

    return lines.join('\n');
  },
});
