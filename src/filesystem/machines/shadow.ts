import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

const shadowConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: 'ace0140d2da9deaa60d16eb681afb542', // sh4d0w_r00t
      userType: 'root',
      uid: 0,
    },
    {
      username: 'operator',
      passwordHash: '8687c82d19711171491bbcbda4353a50', // c0ntr0l_pl4n3
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
      content: 'shadow\n',
    },
    hosts: {
      name: 'hosts',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `127.0.0.1       localhost
10.66.66.1      shadow shadow.hidden
10.66.66.2      void.hidden
10.66.66.3      abyss.hidden
10.66.66.100    darknet
`,
    },
  },
};

export const shadow: FileNode = createFileSystem(shadowConfig);
