import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

const voidConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: '5f4dcc3b5aa765d61d8327deb882cf99', // password
      userType: 'root',
      uid: 0,
    },
    {
      username: 'dbadmin',
      passwordHash: '098f6bcd4621d373cade4e832627b4f6', // test
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
