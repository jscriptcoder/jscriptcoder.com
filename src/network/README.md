# Network

Simulated network environment for CTF puzzles. Defines the topology, machines, ports, services, and DNS records that network commands interact with.

## Files

| File | Description |
|------|-------------|
| `types.ts` | Core types: `NetworkInterface`, `RemoteMachine`, `Port`, `DnsRecord`, `NetworkConfig` |
| `initialNetwork.ts` | `createInitialNetwork()` — defines the full network topology (machines, ports, DNS) |
| `NetworkContext.tsx` | React context providing network queries: `getMachine`, `resolveDomain`, `getInterfaces`, `getLocalIP`, `getGateway` |
| `index.ts` | Module exports |

## Network Topology

```
192.168.1.0/24 (Local Network)
├── 192.168.1.1   gateway     — Router, HTTP/HTTPS open
├── 192.168.1.50  fileserver  — FTP and SSH open
├── 192.168.1.75  webserver   — SSH, HTTP, MySQL, backdoor:4444
└── 192.168.1.100 localhost   — Player's machine (eth0)

External
└── 203.0.113.42  darknet     — SSH, HTTP-ALT:8080, backdoor:31337
```

## Machines & Services

| Machine | IP | Open Ports | Services |
|---------|-----|-----------|----------|
| gateway | 192.168.1.1 | 80, 443 | http, https |
| fileserver | 192.168.1.50 | 21, 22 | ftp, ssh |
| webserver | 192.168.1.75 | 22, 80, 3306, 4444 | ssh, http, mysql, elite (backdoor) |
| darknet | 203.0.113.42 | 22, 8080, 31337 | ssh, http-alt, elite (backdoor) |

## DNS Records

| Domain | IP | Type |
|--------|-----|------|
| gateway.local | 192.168.1.1 | A |
| fileserver.local | 192.168.1.50 | A |
| webserver.local | 192.168.1.75 | A |
| darknet.ctf | 203.0.113.42 | A |
| www.darknet.ctf | 203.0.113.42 | A |

## Key Types

**Port** — includes optional `owner` for interactive services (backdoors via `nc`):

```typescript
type Port = {
  readonly port: number;
  readonly service: string;
  readonly open: boolean;
  readonly owner?: ServiceOwner; // username, userType, homePath
};
```

**RemoteMachine** — each machine has an IP, hostname, open ports, and user accounts:

```typescript
type RemoteMachine = {
  readonly ip: string;
  readonly hostname: string;
  readonly ports: readonly Port[];
  readonly users: readonly RemoteUser[];
};
```

## Context API

`useNetwork()` provides read-only queries:

- `getMachine(ip)` — find a machine by IP
- `getMachines()` — list all machines
- `getInterface(name)` — get a network interface (e.g., `eth0`)
- `getLocalIP()` — player's IP address
- `getGateway()` — gateway IP
- `resolveDomain(domain)` — DNS lookup
- `getDnsRecords()` — all DNS records
