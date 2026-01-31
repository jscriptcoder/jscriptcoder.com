export interface NetworkInterface {
  readonly name: string;
  readonly flags: readonly string[];
  readonly inet: string;
  readonly netmask: string;
  readonly gateway: string;
  readonly mac: string;
}

export interface Port {
  readonly port: number;
  readonly service: string;
  readonly open: boolean;
}

export interface RemoteUser {
  readonly username: string;
  readonly passwordHash: string;
  readonly userType: 'root' | 'user' | 'guest';
}

export interface RemoteMachine {
  readonly ip: string;
  readonly hostname: string;
  readonly ports: readonly Port[];
  readonly users: readonly RemoteUser[];
}

export interface DnsRecord {
  readonly domain: string;
  readonly ip: string;
  readonly type: 'A';
}

export interface NetworkConfig {
  readonly interfaces: readonly NetworkInterface[];
  readonly machines: readonly RemoteMachine[];
  readonly dnsRecords: readonly DnsRecord[];
}
