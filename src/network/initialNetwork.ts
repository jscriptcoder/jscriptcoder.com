import type { NetworkConfig } from './types';

export const createInitialNetwork = (): NetworkConfig => ({
  interfaces: [
    {
      name: 'eth0',
      flags: ['UP', 'BROADCAST', 'RUNNING', 'MULTICAST'],
      inet: '192.168.1.100',
      netmask: '255.255.255.0',
      gateway: '192.168.1.1',
      mac: '02:42:ac:11:00:02',
    },
  ],
  machines: [
    // Router/Gateway
    {
      ip: '192.168.1.1',
      hostname: 'gateway',
      ports: [
        { port: 22, service: 'ssh', open: false },
        { port: 80, service: 'http', open: true },
        { port: 443, service: 'https', open: true },
      ],
      users: [
        { username: 'admin', passwordHash: '21232f297a57a5a743894a0e4a801fc3', userType: 'root' }, // admin
      ],
    },
    // File server
    {
      ip: '192.168.1.50',
      hostname: 'fileserver',
      ports: [
        { port: 21, service: 'ftp', open: true },
        { port: 22, service: 'ssh', open: true },
      ],
      users: [
        { username: 'root', passwordHash: '63a9f0ea7bb98050796b649e85481845', userType: 'root' }, // root
        { username: 'ftpuser', passwordHash: '5f4dcc3b5aa765d61d8327deb882cf99', userType: 'user' }, // password
      ],
    },
    // Web server
    {
      ip: '192.168.1.75',
      hostname: 'webserver',
      ports: [
        { port: 22, service: 'ssh', open: true },
        { port: 80, service: 'http', open: true },
        { port: 3306, service: 'mysql', open: true },
      ],
      users: [
        { username: 'root', passwordHash: '63a9f0ea7bb98050796b649e85481845', userType: 'root' }, // root
        { username: 'www-data', passwordHash: 'a384b6463fc216a5f8ecb6670f86456a', userType: 'user' }, // webmaster
      ],
    },
    // External secret server (outside local network)
    {
      ip: '203.0.113.42',
      hostname: 'darknet',
      ports: [
        { port: 22, service: 'ssh', open: true },
        { port: 8080, service: 'http-alt', open: true },
        { port: 31337, service: 'backdoor', open: true },
      ],
      users: [
        { username: 'root', passwordHash: '5f4dcc3b5aa765d61d8327deb882cf99', userType: 'root' }, // password
        { username: 'ghost', passwordHash: '7c6a180b36896a65c3ccdc6e70b6b8f7', userType: 'user' }, // fun123
      ],
    },
  ],
  dnsRecords: [
    // Local network hostnames
    { domain: 'gateway.local', ip: '192.168.1.1', type: 'A' },
    { domain: 'fileserver.local', ip: '192.168.1.50', type: 'A' },
    { domain: 'webserver.local', ip: '192.168.1.75', type: 'A' },
    // External domains
    { domain: 'darknet.ctf', ip: '203.0.113.42', type: 'A' },
    { domain: 'www.darknet.ctf', ip: '203.0.113.42', type: 'A' },
  ],
});
