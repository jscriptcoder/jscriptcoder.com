import type { FileNode } from './types';
import type { UserType } from '../session/SessionContext';

export type UserConfig = {
  readonly username: string;
  readonly passwordHash: string;
  readonly userType: UserType;
  readonly uid: number;
  readonly homeContent?: Readonly<Record<string, FileNode>>;
};

export type MachineFileSystemConfig = {
  readonly users: readonly UserConfig[];
  readonly rootContent?: Readonly<Record<string, FileNode>>;
  readonly varLogContent?: Readonly<Record<string, FileNode>>;
  readonly etcExtraContent?: Readonly<Record<string, FileNode>>;
  readonly extraDirectories?: Readonly<Record<string, FileNode>>;
  readonly passwdReadableBy?: readonly UserType[];
};

const generatePasswdContent = (users: readonly UserConfig[]): string =>
  users
    .map(
      (u) =>
        `${u.username}:${u.passwordHash}:${u.uid}:${u.uid}:${u.username}:${u.userType === 'root' ? '/root' : `/home/${u.username}`}:/bin/bash`,
    )
    .join('\n');

const createHomeDirectory = (user: UserConfig): FileNode => ({
  name: user.username,
  type: 'directory',
  owner: user.userType,
  permissions: {
    read: user.userType === 'guest' ? ['root', 'user', 'guest'] : ['root', user.userType],
    write: ['root', user.userType],
    execute: user.userType === 'guest' ? ['root', 'user', 'guest'] : ['root', user.userType],
  },
  children: user.homeContent ?? {},
});

const createHomeDirectories = (
  users: readonly UserConfig[],
): Readonly<Record<string, FileNode>> => {
  const regularUsers = users.filter((u) => u.userType !== 'root');
  return Object.fromEntries(regularUsers.map((user) => [user.username, createHomeDirectory(user)]));
};

export const createFileSystem = (config: MachineFileSystemConfig): FileNode => ({
  name: '/',
  type: 'directory',
  owner: 'root',
  permissions: {
    read: ['root', 'user', 'guest'],
    write: ['root'],
    execute: ['root', 'user', 'guest'],
  },
  children: {
    root: {
      name: 'root',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root'],
        write: ['root'],
        execute: ['root'],
      },
      children: config.rootContent ?? {},
    },
    home: {
      name: 'home',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user', 'guest'],
        write: ['root'],
        execute: ['root', 'user', 'guest'],
      },
      children: createHomeDirectories(config.users),
    },
    etc: {
      name: 'etc',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user', 'guest'],
        write: ['root'],
        execute: ['root', 'user', 'guest'],
      },
      children: {
        passwd: {
          name: 'passwd',
          type: 'file',
          owner: 'root',
          permissions: {
            read: [...(config.passwdReadableBy ?? ['root'])],
            write: ['root'],
            execute: ['root'],
          },
          content: generatePasswdContent(config.users),
        },
        ...config.etcExtraContent,
      },
    },
    var: {
      name: 'var',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user', 'guest'],
        write: ['root'],
        execute: ['root', 'user', 'guest'],
      },
      children: {
        log: {
          name: 'log',
          type: 'directory',
          owner: 'root',
          permissions: {
            read: ['root', 'user'],
            write: ['root'],
            execute: ['root', 'user'],
          },
          children: config.varLogContent ?? {},
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
        execute: ['root', 'user', 'guest'],
      },
      children: {},
    },
    ...config.extraDirectories,
  },
});
