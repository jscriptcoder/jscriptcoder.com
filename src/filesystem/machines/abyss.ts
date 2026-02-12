import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

const abyssConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: 'f81e258a762fbfac58a72dee289ea2c5', // d33p_d4rk
      userType: 'root',
      uid: 0,
    },
    {
      username: 'phantom',
      passwordHash: '7312e6b090b29bd2d55f3284fc2472d2', // sp3ctr4l
      userType: 'user',
      uid: 1000,
    },
    {
      username: 'guest',
      passwordHash: 'fe01ce2a7fbac8fafaed7c982a04e229', // demo
      userType: 'guest',
      uid: 1001,
    },
  ],
  etcExtraContent: {
    hostname: {
      name: 'hostname',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: 'abyss\n',
    },
    hosts: {
      name: 'hosts',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `127.0.0.1       localhost
10.66.66.3      abyss abyss.hidden
10.66.66.1      shadow.hidden
10.66.66.2      void.hidden
10.66.66.100    darknet
`,
    },
  },
};

export const abyss: FileNode = createFileSystem(abyssConfig);
