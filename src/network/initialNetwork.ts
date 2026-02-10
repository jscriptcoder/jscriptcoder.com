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
        { port: 22, service: 'ssh', open: true },
        { port: 80, service: 'http', open: true },
        { port: 443, service: 'https', open: true },
      ],
      users: [
        { username: 'admin', passwordHash: 'dab569cb96513965ca00379d69b2f40c', userType: 'root' }, // n3tgu4rd!
        { username: 'guest', passwordHash: 'dbf0171774108c80c94819b1ce0dbd9b', userType: 'guest' }, // guest2024
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
        { username: 'root', passwordHash: '4a080e0e088d55294ab894a02b5c8e3f', userType: 'root' }, // b4ckup2024
        { username: 'ftpuser', passwordHash: 'be7a9d8e813210208cb7fba28717cda7', userType: 'user' }, // tr4nsf3r
        { username: 'guest', passwordHash: '294de3557d9d00b3d2d8a1e6aab028cf', userType: 'guest' }, // anonymous
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
        {
          port: 4444,
          service: 'elite',
          open: true,
          owner: { username: 'www-data', userType: 'user', homePath: '/var/www' },
        },
      ],
      users: [
        { username: 'root', passwordHash: 'a6f6c10dc3602b020c56ff49fb043ca9', userType: 'root' }, // r00tW3b!
        {
          username: 'www-data',
          passwordHash: 'd2d8d0cdf38ea5a54439ffadf7597722',
          userType: 'user',
        }, // d3v0ps2024
        { username: 'guest', passwordHash: 'b2ce03aefab9060e1a42bd1aa1c571f6', userType: 'guest' }, // w3lcome
      ],
    },
    // External secret server (outside local network)
    {
      ip: '203.0.113.42',
      hostname: 'darknet',
      ports: [
        { port: 22, service: 'ssh', open: true },
        { port: 8080, service: 'http-alt', open: true },
        {
          port: 31337,
          service: 'elite',
          open: true,
          owner: { username: 'ghost', userType: 'user', homePath: '/home/ghost' },
        },
      ],
      users: [
        { username: 'root', passwordHash: '63d7f708b7feb9c0494c64dbfb087f83', userType: 'root' }, // d4rkn3tR00t
        { username: 'ghost', passwordHash: 'd2aef0b37551aecfb067036d57f14930', userType: 'user' }, // sp3ctr3
        { username: 'guest', passwordHash: 'e5ec4133db0a2e088310e8ecb0ee51d7', userType: 'guest' }, // sh4d0w
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
