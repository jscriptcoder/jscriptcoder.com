import type { FileNode } from './types';

// Initial passwords (MD5 hashed - weak enough to crack with rainbow tables)
const PASSWORDS = {
  root: '7b24afc8bc80e548d66c4e7ff72171c5',
  jshacker: 'de9b9ed78d7e2e1dceeffee780e2f919',
  guest: 'fcf41657f02f88137a1bcf068a32c0a3',
};

// Generate passwd file content
const generatePasswdContent = (): string => {
  return [
    `root:${PASSWORDS.root}:0:0:root:/root:/bin/bash`,
    `jshacker:${PASSWORDS.jshacker}:1000:1000:jshacker:/home/jshacker:/bin/bash`,
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
      children: {
        '.secret': {
          name: '.secret',
          type: 'file',
          owner: 'root',
          permissions: {
            read: ['root'],
            write: ['root'],
          },
          content: 'FLAG{hidden_in_plain_sight}',
        },
      },
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
        jshacker: {
          name: 'jshacker',
          type: 'directory',
          owner: 'user',
          permissions: {
            read: ['root', 'user'],
            write: ['root', 'user'],
          },
          children: {
            'README.md': {
              name: 'README.md',
              type: 'file',
              owner: 'user',
              permissions: {
                read: ['root', 'user'],
                write: ['root', 'user'],
              },
              content: `# Welcome to JSHACK.ME

You are a hacker on a machine connected to a network.
Your mission is to find all the hidden FLAGS.

## Rules

- Flags are in the format: FLAG{...}
- Some flags are on this machine, others are on remote systems
- You'll need to escalate privileges and pivot through the network
- Use your knowledge of Linux, networking, and hacking

## Getting Started

1. Explore the file system with ls() and cd()
2. Check your network configuration with ifconfig()
3. Discover other machines with ping() and nmap()
4. Crack passwords, exploit misconfigurations, find the flags

## Hints

- The /etc directory often contains useful information
- Hidden files start with a dot (use ls("-a") to see them)
- Weak passwords can be cracked with rainbow tables

Good luck, hacker.
`,
            },
          },
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
