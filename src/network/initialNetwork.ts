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
  ],
});
