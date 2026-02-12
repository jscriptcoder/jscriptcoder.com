import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

const abyssConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: 'd8578edf8458ce06fbc5bb76a58c5ca4', // qwerty
      userType: 'root',
      uid: 0,
    },
    {
      username: 'phantom',
      passwordHash: 'eb0a191797624dd3a48fa681d3061212', // master
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
