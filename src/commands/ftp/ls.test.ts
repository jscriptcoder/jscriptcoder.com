import { describe, it, expect } from 'vitest';
import { createFtpLsCommand } from './ls';
import type { FileNode } from '../../filesystem/types';
import type { UserType } from '../../context/SessionContext';
import type { MachineId } from '../../filesystem/machineFileSystems';

// --- Factory Functions ---

const createMockFileNode = (overrides?: Partial<FileNode>): FileNode => ({
  name: 'test',
  type: 'directory',
  owner: 'root',
  permissions: {
    read: ['root', 'user', 'guest'],
    write: ['root'],
  },
  children: {},
  ...overrides,
});

type MockContextConfig = {
  readonly remoteMachine?: MachineId;
  readonly remoteCwd?: string;
  readonly remoteUserType?: UserType;
  readonly nodes?: Readonly<Record<string, FileNode | null>>;
  readonly directoryEntries?: Readonly<Record<string, string[]>>;
};

const createMockContext = (config: MockContextConfig = {}) => {
  const {
    remoteMachine = '192.168.1.50',
    remoteCwd = '/srv/ftp',
    remoteUserType = 'user',
    nodes = {},
    directoryEntries = {},
  } = config;

  const resolvePathForMachine = (path: string, cwd: string): string => {
    if (path.startsWith('/')) return path;
    if (path === '..') {
      const parts = cwd.split('/').filter(Boolean);
      return '/' + parts.slice(0, -1).join('/') || '/';
    }
    if (path === '.') return cwd;
    return cwd === '/' ? `/${path}` : `${cwd}/${path}`;
  };

  const getNodeFromMachine = (_machineId: MachineId, path: string, _cwd: string): FileNode | null => {
    return nodes[path] ?? null;
  };

  const listDirectoryFromMachine = (_machineId: MachineId, path: string, _cwd: string, _userType: UserType): string[] | null => {
    return directoryEntries[path] ?? null;
  };

  return {
    getRemoteMachine: () => remoteMachine,
    getRemoteCwd: () => remoteCwd,
    getRemoteUserType: () => remoteUserType,
    resolvePathForMachine,
    getNodeFromMachine,
    listDirectoryFromMachine,
  };
};

// --- Tests ---

describe('FTP ls command', () => {
  describe('listing directories', () => {
    it('should list current directory when no path given', () => {
      const context = createMockContext({
        remoteCwd: '/srv/ftp',
        nodes: {
          '/srv/ftp': createMockFileNode({ name: 'ftp' }),
        },
        directoryEntries: {
          '/srv/ftp': ['file1.txt', 'file2.txt'],
        },
      });
      const ls = createFtpLsCommand(context);

      const result = ls.fn();

      expect(result).toBe('file1.txt  file2.txt');
    });

    it('should list specified directory', () => {
      const context = createMockContext({
        remoteCwd: '/home',
        nodes: {
          '/srv/ftp': createMockFileNode({ name: 'ftp' }),
        },
        directoryEntries: {
          '/srv/ftp': ['pub', 'incoming'],
        },
      });
      const ls = createFtpLsCommand(context);

      const result = ls.fn('/srv/ftp');

      expect(result).toBe('pub  incoming');
    });

    it('should list relative path', () => {
      const context = createMockContext({
        remoteCwd: '/srv',
        nodes: {
          '/srv/ftp': createMockFileNode({ name: 'ftp' }),
        },
        directoryEntries: {
          '/srv/ftp': ['data.zip'],
        },
      });
      const ls = createFtpLsCommand(context);

      const result = ls.fn('ftp');

      expect(result).toBe('data.zip');
    });

    it('should return empty directory message', () => {
      const context = createMockContext({
        remoteCwd: '/srv/ftp',
        nodes: {
          '/srv/ftp': createMockFileNode({ name: 'ftp' }),
        },
        directoryEntries: {
          '/srv/ftp': [],
        },
      });
      const ls = createFtpLsCommand(context);

      const result = ls.fn();

      expect(result).toBe('(empty directory)');
    });

    it('should add trailing slash to directories', () => {
      const context = createMockContext({
        remoteCwd: '/srv',
        nodes: {
          '/srv': createMockFileNode({ name: 'srv' }),
          '/srv/ftp': createMockFileNode({ name: 'ftp', type: 'directory' }),
          '/srv/data.txt': createMockFileNode({ name: 'data.txt', type: 'file' }),
        },
        directoryEntries: {
          '/srv': ['ftp', 'data.txt'],
        },
      });
      const ls = createFtpLsCommand(context);

      const result = ls.fn();

      expect(result).toBe('ftp/  data.txt');
    });
  });

  describe('listing files', () => {
    it('should return file name when path is a file', () => {
      const context = createMockContext({
        remoteCwd: '/srv/ftp',
        nodes: {
          '/srv/ftp/readme.txt': createMockFileNode({
            name: 'readme.txt',
            type: 'file',
            content: 'hello',
          }),
        },
      });
      const ls = createFtpLsCommand(context);

      const result = ls.fn('readme.txt');

      expect(result).toBe('readme.txt');
    });
  });

  describe('error handling', () => {
    it('should throw error when path does not exist', () => {
      const context = createMockContext({
        remoteCwd: '/srv/ftp',
        nodes: {},
      });
      const ls = createFtpLsCommand(context);

      expect(() => ls.fn('/nonexistent')).toThrow('ls: /nonexistent: No such file or directory');
    });

    it('should throw error when permission denied on directory', () => {
      const context = createMockContext({
        remoteCwd: '/',
        remoteUserType: 'guest',
        nodes: {
          '/root': createMockFileNode({
            name: 'root',
            permissions: {
              read: ['root'],
              write: ['root'],
            },
          }),
        },
      });
      const ls = createFtpLsCommand(context);

      expect(() => ls.fn('/root')).toThrow('ls: /root: Permission denied');
    });

    it('should throw error when listDirectory returns null', () => {
      const context = createMockContext({
        remoteCwd: '/srv',
        nodes: {
          '/srv/restricted': createMockFileNode({ name: 'restricted' }),
        },
        directoryEntries: {},
      });
      const ls = createFtpLsCommand(context);

      expect(() => ls.fn('restricted')).toThrow('ls: restricted: Permission denied');
    });
  });

  describe('command metadata', () => {
    it('should have correct name', () => {
      const context = createMockContext();
      const ls = createFtpLsCommand(context);

      expect(ls.name).toBe('ls');
    });

    it('should have description', () => {
      const context = createMockContext();
      const ls = createFtpLsCommand(context);

      expect(ls.description).toBe('List remote directory contents');
    });

    it('should have manual with examples', () => {
      const context = createMockContext();
      const ls = createFtpLsCommand(context);

      expect(ls.manual).toBeDefined();
      expect(ls.manual?.examples?.length).toBeGreaterThan(0);
    });
  });
});
