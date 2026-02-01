import { describe, it, expect, vi } from 'vitest';
import type { FileNode } from '../filesystem/types';
import type { UserType } from '../context/SessionContext';
import { createLsCommand } from './ls';
import { createCdCommand } from './cd';
import { createCatCommand } from './cat';

// --- Factory Functions ---

const getMockFileNode = (overrides?: Partial<FileNode>): FileNode => ({
  name: 'test',
  type: 'directory',
  owner: 'root',
  permissions: {
    read: ['root', 'user', 'guest'],
    write: ['root'],
  },
  ...overrides,
});

const getMockFile = (overrides?: Partial<FileNode>): FileNode =>
  getMockFileNode({
    name: 'file.txt',
    type: 'file',
    content: 'test content',
    ...overrides,
  });

const getMockDirectory = (
  name: string,
  children: Record<string, FileNode>,
  overrides?: Partial<FileNode>
): FileNode =>
  getMockFileNode({
    name,
    type: 'directory',
    children,
    ...overrides,
  });

type FileSystemContextConfig = {
  readonly currentPath?: string;
  readonly userType?: UserType;
  readonly homePath?: string;
  readonly fileSystem?: Record<string, FileNode | null>;
};

const createMockFileSystemContext = (config: FileSystemContextConfig = {}) => {
  const {
    currentPath = '/',
    userType = 'user',
    homePath = '/home/jshacker',
    fileSystem = {},
  } = config;

  const resolvePath = (path: string) => {
    if (path.startsWith('/')) return path;
    if (path === '.') return currentPath;
    if (path === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/');
    }
    return currentPath === '/' ? `/${path}` : `${currentPath}/${path}`;
  };

  return {
    getCurrentPath: () => currentPath,
    resolvePath,
    getNode: (path: string) => fileSystem[path] ?? null,
    getUserType: () => userType,
    getHomePath: () => homePath,
    setCurrentPath: vi.fn(),
  };
};

// --- Tests ---

describe('ls command', () => {
  describe('basic listing', () => {
    it('should list current directory when no path given', () => {
      const homeDir = getMockDirectory('home', {
        'file1.txt': getMockFile({ name: 'file1.txt' }),
        'file2.txt': getMockFile({ name: 'file2.txt' }),
      });

      const context = createMockFileSystemContext({
        currentPath: '/home',
        fileSystem: { '/home': homeDir },
      });

      const ls = createLsCommand(context);
      const result = ls.fn();

      expect(result).toBe('file1.txt  file2.txt');
    });

    it('should list specified path', () => {
      const etcDir = getMockDirectory('etc', {
        'passwd': getMockFile({ name: 'passwd' }),
        'hosts': getMockFile({ name: 'hosts' }),
      });

      const context = createMockFileSystemContext({
        currentPath: '/home',
        fileSystem: { '/etc': etcDir },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('/etc');

      expect(result).toBe('hosts  passwd');
    });

    it('should mark directories with trailing slash', () => {
      const homeDir = getMockDirectory('home', {
        'documents': getMockDirectory('documents', {}),
        'file.txt': getMockFile({ name: 'file.txt' }),
      });

      const context = createMockFileSystemContext({
        fileSystem: { '/home': homeDir },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('/home');

      expect(result).toBe('documents/  file.txt');
    });

    it('should sort entries alphabetically', () => {
      const dir = getMockDirectory('test', {
        'zebra.txt': getMockFile({ name: 'zebra.txt' }),
        'alpha.txt': getMockFile({ name: 'alpha.txt' }),
        'middle.txt': getMockFile({ name: 'middle.txt' }),
      });

      const context = createMockFileSystemContext({
        fileSystem: { '/test': dir },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('/test');

      expect(result).toBe('alpha.txt  middle.txt  zebra.txt');
    });

    it('should return empty string for empty directory', () => {
      const emptyDir = getMockDirectory('empty', {});

      const context = createMockFileSystemContext({
        fileSystem: { '/empty': emptyDir },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('/empty');

      expect(result).toBe('');
    });

    it('should return filename when path is a file', () => {
      const file = getMockFile({ name: 'myfile.txt' });

      const context = createMockFileSystemContext({
        fileSystem: { '/myfile.txt': file },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('/myfile.txt');

      expect(result).toBe('myfile.txt');
    });
  });

  describe('hidden files', () => {
    const dirWithHidden = getMockDirectory('home', {
      '.bashrc': getMockFile({ name: '.bashrc' }),
      '.profile': getMockFile({ name: '.profile' }),
      'visible.txt': getMockFile({ name: 'visible.txt' }),
    });

    it('should hide files starting with dot by default', () => {
      const context = createMockFileSystemContext({
        fileSystem: { '/home': dirWithHidden },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('/home');

      expect(result).toBe('visible.txt');
      expect(result).not.toContain('.bashrc');
      expect(result).not.toContain('.profile');
    });

    it('should show hidden files with -a option', () => {
      const context = createMockFileSystemContext({
        fileSystem: { '/home': dirWithHidden },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('/home', '-a');

      expect(result).toContain('.bashrc');
      expect(result).toContain('.profile');
      expect(result).toContain('visible.txt');
    });

    it('should accept -a option before path', () => {
      const context = createMockFileSystemContext({
        fileSystem: { '/home': dirWithHidden },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('-a', '/home');

      expect(result).toContain('.bashrc');
    });

    it('should accept -a option without path', () => {
      const context = createMockFileSystemContext({
        currentPath: '/home',
        fileSystem: { '/home': dirWithHidden },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('-a');

      expect(result).toContain('.bashrc');
    });
  });

  describe('error handling', () => {
    it('should throw error for non-existent path', () => {
      const context = createMockFileSystemContext({
        fileSystem: {},
      });

      const ls = createLsCommand(context);

      expect(() => ls.fn('/nonexistent')).toThrow(
        "ls: cannot access '/nonexistent': No such file or directory"
      );
    });

    it('should throw error when permission denied', () => {
      const restrictedDir = getMockDirectory('root', {}, {
        permissions: {
          read: ['root'],
          write: ['root'],
        },
      });

      const context = createMockFileSystemContext({
        userType: 'guest',
        fileSystem: { '/root': restrictedDir },
      });

      const ls = createLsCommand(context);

      expect(() => ls.fn('/root')).toThrow(
        "ls: cannot open directory '/root': Permission denied"
      );
    });

    it('should allow root to list any directory', () => {
      const restrictedDir = getMockDirectory('secret', {
        'secret.txt': getMockFile({ name: 'secret.txt' }),
      }, {
        permissions: {
          read: ['root'],
          write: ['root'],
        },
      });

      const context = createMockFileSystemContext({
        userType: 'root',
        fileSystem: { '/secret': restrictedDir },
      });

      const ls = createLsCommand(context);
      const result = ls.fn('/secret');

      expect(result).toBe('secret.txt');
    });
  });
});

describe('cd command', () => {
  describe('basic navigation', () => {
    it('should change to specified directory', () => {
      const etcDir = getMockDirectory('etc', {});

      const context = createMockFileSystemContext({
        currentPath: '/home',
        fileSystem: { '/etc': etcDir },
      });

      const cd = createCdCommand(context);
      cd.fn('/etc');

      expect(context.setCurrentPath).toHaveBeenCalledWith('/etc');
    });

    it('should change to home directory when no path given', () => {
      const homeDir = getMockDirectory('jshacker', {});

      const context = createMockFileSystemContext({
        currentPath: '/etc',
        homePath: '/home/jshacker',
        fileSystem: { '/home/jshacker': homeDir },
      });

      const cd = createCdCommand(context);
      cd.fn();

      expect(context.setCurrentPath).toHaveBeenCalledWith('/home/jshacker');
    });

    it('should return undefined (no output)', () => {
      const homeDir = getMockDirectory('home', {});

      const context = createMockFileSystemContext({
        fileSystem: { '/home': homeDir },
      });

      const cd = createCdCommand(context);
      const result = cd.fn('/home');

      expect(result).toBeUndefined();
    });

    it('should resolve relative paths', () => {
      const subDir = getMockDirectory('subdir', {});

      const context = createMockFileSystemContext({
        currentPath: '/home',
        fileSystem: { '/home/subdir': subDir },
      });

      const cd = createCdCommand(context);
      cd.fn('subdir');

      expect(context.setCurrentPath).toHaveBeenCalledWith('/home/subdir');
    });

    it('should resolve parent directory with ..', () => {
      const homeDir = getMockDirectory('home', {});

      const context = createMockFileSystemContext({
        currentPath: '/home/jshacker',
        fileSystem: { '/home': homeDir },
      });

      const cd = createCdCommand(context);
      cd.fn('..');

      expect(context.setCurrentPath).toHaveBeenCalledWith('/home');
    });
  });

  describe('error handling', () => {
    it('should throw error for non-existent path', () => {
      const context = createMockFileSystemContext({
        fileSystem: {},
      });

      const cd = createCdCommand(context);

      expect(() => cd.fn('/nonexistent')).toThrow(
        'cd: /nonexistent: No such file or directory'
      );
    });

    it('should throw error when path is a file', () => {
      const file = getMockFile({ name: 'file.txt' });

      const context = createMockFileSystemContext({
        fileSystem: { '/file.txt': file },
      });

      const cd = createCdCommand(context);

      expect(() => cd.fn('/file.txt')).toThrow(
        'cd: /file.txt: Not a directory'
      );
    });

    it('should throw error when permission denied', () => {
      const restrictedDir = getMockDirectory('root', {}, {
        permissions: {
          read: ['root'],
          write: ['root'],
        },
      });

      const context = createMockFileSystemContext({
        userType: 'guest',
        fileSystem: { '/root': restrictedDir },
      });

      const cd = createCdCommand(context);

      expect(() => cd.fn('/root')).toThrow('cd: /root: Permission denied');
    });

    it('should allow root to access any directory', () => {
      const restrictedDir = getMockDirectory('secret', {}, {
        permissions: {
          read: ['root'],
          write: ['root'],
        },
      });

      const context = createMockFileSystemContext({
        userType: 'root',
        fileSystem: { '/secret': restrictedDir },
      });

      const cd = createCdCommand(context);
      cd.fn('/secret');

      expect(context.setCurrentPath).toHaveBeenCalledWith('/secret');
    });

    it('should not change directory on error', () => {
      const context = createMockFileSystemContext({
        fileSystem: {},
      });

      const cd = createCdCommand(context);

      expect(() => cd.fn('/nonexistent')).toThrow();
      expect(context.setCurrentPath).not.toHaveBeenCalled();
    });
  });
});

describe('cat command', () => {
  describe('displaying file contents', () => {
    it('should display file content', () => {
      const file = getMockFile({
        name: 'readme.txt',
        content: 'Hello, World!',
      });

      const context = createMockFileSystemContext({
        fileSystem: { '/readme.txt': file },
      });

      const cat = createCatCommand(context);
      const result = cat.fn('/readme.txt');

      expect(result).toBe('Hello, World!');
    });

    it('should return empty string for file with no content', () => {
      const file = getMockFile({
        name: 'empty.txt',
        content: undefined,
      });

      const context = createMockFileSystemContext({
        fileSystem: { '/empty.txt': file },
      });

      const cat = createCatCommand(context);
      const result = cat.fn('/empty.txt');

      expect(result).toBe('');
    });

    it('should resolve relative paths', () => {
      const file = getMockFile({
        name: 'file.txt',
        content: 'relative content',
      });

      const context = createMockFileSystemContext({
        currentPath: '/home',
        fileSystem: { '/home/file.txt': file },
      });

      const cat = createCatCommand(context);
      const result = cat.fn('file.txt');

      expect(result).toBe('relative content');
    });

    it('should preserve multiline content', () => {
      const file = getMockFile({
        name: 'multiline.txt',
        content: 'line 1\nline 2\nline 3',
      });

      const context = createMockFileSystemContext({
        fileSystem: { '/multiline.txt': file },
      });

      const cat = createCatCommand(context);
      const result = cat.fn('/multiline.txt');

      expect(result).toBe('line 1\nline 2\nline 3');
    });
  });

  describe('error handling', () => {
    it('should throw error when no path given', () => {
      const context = createMockFileSystemContext({
        fileSystem: {},
      });

      const cat = createCatCommand(context);

      expect(() => cat.fn()).toThrow('cat: missing file operand');
    });

    it('should throw error for non-existent file', () => {
      const context = createMockFileSystemContext({
        fileSystem: {},
      });

      const cat = createCatCommand(context);

      expect(() => cat.fn('/nonexistent.txt')).toThrow(
        'cat: /nonexistent.txt: No such file or directory'
      );
    });

    it('should throw error when path is a directory', () => {
      const dir = getMockDirectory('mydir', {});

      const context = createMockFileSystemContext({
        fileSystem: { '/mydir': dir },
      });

      const cat = createCatCommand(context);

      expect(() => cat.fn('/mydir')).toThrow('cat: /mydir: Is a directory');
    });

    it('should throw error when permission denied', () => {
      const restrictedFile = getMockFile({
        name: 'secret.txt',
        content: 'top secret',
        permissions: {
          read: ['root'],
          write: ['root'],
        },
      });

      const context = createMockFileSystemContext({
        userType: 'guest',
        fileSystem: { '/secret.txt': restrictedFile },
      });

      const cat = createCatCommand(context);

      expect(() => cat.fn('/secret.txt')).toThrow(
        'cat: /secret.txt: Permission denied'
      );
    });

    it('should allow root to read any file', () => {
      const restrictedFile = getMockFile({
        name: 'secret.txt',
        content: 'top secret data',
        permissions: {
          read: ['root'],
          write: ['root'],
        },
      });

      const context = createMockFileSystemContext({
        userType: 'root',
        fileSystem: { '/secret.txt': restrictedFile },
      });

      const cat = createCatCommand(context);
      const result = cat.fn('/secret.txt');

      expect(result).toBe('top secret data');
    });
  });
});
