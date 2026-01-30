export interface NetworkInterface {
  name: string;
  flags: string[];
  inet: string;
  netmask: string;
  gateway: string;
  mac: string;
}

export interface RemoteMachine {
  ip: string;
  hostname: string;
  ports: {
    port: number;
    service: string;
    open: boolean;
  }[];
  // Each remote machine has its own filesystem
  users: {
    username: string;
    passwordHash: string;
    userType: 'root' | 'user' | 'guest';
  }[];
}

export interface DnsRecord {
  domain: string;
  ip: string;
  type: 'A'; // Only A records for now
}

export interface NetworkConfig {
  interfaces: NetworkInterface[];
  machines: RemoteMachine[];
  dnsRecords: DnsRecord[];
}
