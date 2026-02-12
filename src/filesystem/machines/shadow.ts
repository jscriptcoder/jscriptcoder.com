import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

const shadowConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: 'e99a18c428cb38d5f260853678922e03', // abc123
      userType: 'root',
      uid: 0,
    },
    {
      username: 'operator',
      passwordHash: 'c18696e8a628add9628bafdb7905ebe4', // 0p3r8t0r
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
