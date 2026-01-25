import type { FileNode } from './types';

// Helper to base64 encode passwords
const encodePassword = (password: string): string => {
  return btoa(password);
};

// Initial passwords (base64 encoded for easy "cracking")
const PASSWORDS = {
  root: encodePassword('toor'), // Classic reversed 'root'
  jscriptcoder: encodePassword('javascript'),
  guest: encodePassword('guest123'),
};

// Generate passwd file content
const generatePasswdContent = (): string => {
  return [
    `root:${PASSWORDS.root}:0:0:root:/root:/bin/bash`,
    `jscriptcoder:${PASSWORDS.jscriptcoder}:1000:1000:jscriptcoder:/home/jscriptcoder:/bin/bash`,
    `guest:${PASSWORDS.guest}:1001:1001:guest:/home/guest:/bin/bash`,
  ].join('\n');
};

export const createInitialFileSystem = (): FileNode => ({
  name: '/',
  type: 'directory',
  owner: 'root',
  permissions: {
    read: ['root', 'user', 'guest'],
    write: ['root'],
  },
  children: {
    root: {
      name: 'root',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root'],
        write: ['root'],
      },
      children: {},
    },
    home: {
      name: 'home',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user', 'guest'],
        write: ['root'],
      },
      children: {
        jscriptcoder: {
          name: 'jscriptcoder',
          type: 'directory',
          owner: 'user',
          permissions: {
            read: ['root', 'user'],
            write: ['root', 'user'],
          },
          children: {},
        },
        guest: {
          name: 'guest',
          type: 'directory',
          owner: 'guest',
          permissions: {
            read: ['root', 'user', 'guest'],
            write: ['root', 'guest'],
          },
          children: {},
        },
      },
    },
    etc: {
      name: 'etc',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user', 'guest'],
        write: ['root'],
      },
      children: {
        passwd: {
          name: 'passwd',
          type: 'file',
          owner: 'root',
          permissions: {
            read: ['root', 'user'], // guest cannot read
            write: ['root'],
          },
          content: generatePasswdContent(),
        },
      },
    },
    var: {
      name: 'var',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user', 'guest'],
        write: ['root'],
      },
      children: {
        log: {
          name: 'log',
          type: 'directory',
          owner: 'root',
          permissions: {
            read: ['root', 'user'],
            write: ['root'],
          },
          children: {},
        },
      },
    },
    tmp: {
      name: 'tmp',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user', 'guest'],
        write: ['root', 'user', 'guest'],
      },
      children: {},
    },
  },
});
