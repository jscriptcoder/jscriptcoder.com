import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

const voidConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: '9581d383d7d09ed2e81c84af511a4d35', // v01d_null
      userType: 'root',
      uid: 0,
    },
    {
      username: 'dbadmin',
      passwordHash: '2b1e0a7a976160137d870678d3b1ed3b', // dr0p_t4bl3s
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
      content: 'void\n',
    },
    hosts: {
      name: 'hosts',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `127.0.0.1       localhost
10.66.66.2      void void.hidden
10.66.66.1      shadow.hidden
10.66.66.3      abyss.hidden
10.66.66.100    darknet
`,
    },
  },
};

export const voidFs: FileNode = createFileSystem(voidConfig);
