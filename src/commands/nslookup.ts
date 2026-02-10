import type { Command, AsyncOutput } from '../components/Terminal/types';
import type { DnsRecord } from '../network/types';

type NslookupContext = {
  readonly resolveDomain: (domain: string) => DnsRecord | undefined;
  readonly getGateway: () => string;
};

// Delay to simulate DNS lookup
const DNS_LOOKUP_DELAY_MS = 600;

export const createNslookupCommand = (context: NslookupContext): Command => ({
  name: 'nslookup',
  description: 'Query DNS for domain name resolution',
  manual: {
    synopsis: 'nslookup(domain: string)',
    description:
      'Query the DNS server to resolve a domain name to its IP address. Returns the IP address associated with the given domain name if found.',
    arguments: [{ name: 'domain', description: 'The domain name to look up', required: true }],
    examples: [
      { command: 'nslookup("gateway.local")', description: 'Resolve a local domain' },
      { command: 'nslookup("darknet.ctf")', description: 'Resolve an external domain' },
    ],
  },
  fn: (...args: unknown[]): AsyncOutput => {
    const { resolveDomain, getGateway } = context;

    const domain = args[0] as string | undefined;

    if (!domain) {
      throw new Error('nslookup: missing domain argument');
    }

    if (typeof domain !== 'string') {
      throw new Error('nslookup: domain must be a string');
    }

    let cancelled = false;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    return {
      __type: 'async',
      start: (onLine, onComplete) => {
        const dnsServer = getGateway();

        // Show server info immediately
        onLine(`Server:  ${dnsServer}`);
        onLine(`Address: ${dnsServer}#53`);
        onLine('');

        // Simulate DNS lookup delay
        const lookupTimeoutId = setTimeout(() => {
          if (cancelled) return;

          const record = resolveDomain(domain);

          if (!record) {
            onLine(`** server can't find ${domain}: NXDOMAIN`);
          } else {
            onLine('Non-authoritative answer:');
            onLine(`Name:    ${record.domain}`);
            onLine(`Address: ${record.ip}`);
          }

          onComplete();
        }, DNS_LOOKUP_DELAY_MS);

        timeoutIds.push(lookupTimeoutId);
      },
      cancel: () => {
        cancelled = true;
        timeoutIds.forEach((id) => clearTimeout(id));
      },
    };
  },
});
