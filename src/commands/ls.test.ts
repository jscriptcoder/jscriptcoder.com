import { describe, it, expect, vi } from 'vitest';
import { createLsCommand } from './ls';
import type { FileNode } from '../filesystem/types';
import type { UserType } from '../context/SessionContext';

// Helper to create a mock file node
const createMockFile = (name: string, owner: UserType = 'user'): FileNode => ({
  name,
  type: 'file',
  owner,
  permissions: {
    read: ['root', 'user'],
    write: ['root', 'user'],
  },
  content: 'test content',
});

// Helper to create a mock directory node
const createMockDirectory = (
  name: string,
  children: Record<string, FileNode> = {},
  readPermissions: UserType[] = ['root', 'user', 'guest']
): FileNode => ({
  name,
  type: 'directory',
  owner: 'root',
  permissions: {
    read: readPermissions,
    write: ['root'],
  },
  children,
});

// Create a mock file system for testing
const mockFileSystem: FileNode = createMockDirectory('/', {
  home: createMockDirectory('home', {
    jshacker: createMockDirectory('jshacker', {
      'README.md': createMockFile('README.md'),
      '.hidden': createMockFile('.hidden'),
      'notes.txt': createMockFile('notes.txt'),
    }),
  }),
  etc: createMockDirectory('etc', {
    passwd: createMockFile('passwd'),
  }),
  root: createMockDirectory('root', {
    '.secret': createMockFile('.secret', 'root'),
  }, ['root']), // Only root can read
});

// Helper to get a node from the mock file system
const getNodeFromPath = (path: string): FileNode | null => {
  if (path === '/') return mockFileSystem;

  const parts = path.split('/').filter(Boolean);
  let current: FileNode = mockFileSystem;

  for (const part of parts) {
    if (current.type !== 'directory' || !current.children) return null;
    const child = current.children[part];
    if (!child) return null;
    current = child;
  }

  return current;
};

describe('ls command', () => {
  const createMockContext = (
    currentPath = '/home/jshacker',
    userType: UserType = 'user'
  ) => ({
    getCurrentPath: vi.fn(() => currentPath),
    resolvePath: vi.fn((path: string) => {
      if (path.startsWith('/')) return path;
      if (path === '..') {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        return '/' + parts.join('/') || '/';
      }
      return currentPath === '/' ? `/${path}` : `${currentPath}/${path}`;
    }),
    getNode: vi.fn((path: string) => getNodeFromPath(path)),
    getUserType: vi.fn(() => userType),
  });

  describe('basic functionality', () => {
    it('should list contents of current directory', () => {
      const context = createMockContext('/home/jshacker');
      const ls = createLsCommand(context);

      const result = ls.fn();

      // localeCompare sorts case-insensitively: n < r
      expect(result).toBe('notes.txt  README.md');
      expect(context.getCurrentPath).toHaveBeenCalled();
    });

    it('should list contents of specified path', () => {
      const context = createMockContext('/home/jshacker');
      const ls = createLsCommand(context);

      const result = ls.fn('/etc');

      expect(result).toBe('passwd');
      expect(context.resolvePath).toHaveBeenCalledWith('/etc');
    });

    it('should show directories with trailing slash', () => {
      const context = createMockContext('/');
      const ls = createLsCommand(context);

      const result = ls.fn('/home');

      expect(result).toBe('jshacker/');
    });

    it('should return empty string for empty directory', () => {
      // Create a context with an empty directory
      const emptyDirFs = createMockDirectory('/', {
        empty: createMockDirectory('empty', {}),
      });

      const context = {
        getCurrentPath: vi.fn(() => '/empty'),
        resolvePath: vi.fn((path: string) => path),
        getNode: vi.fn(() => emptyDirFs.children!['empty']),
        getUserType: vi.fn(() => 'user' as UserType),
      };

      const ls = createLsCommand(context);
      const result = ls.fn();

      expect(result).toBe('');
    });

    it('should return file name when path is a file', () => {
      const context = createMockContext('/home/jshacker');
      const ls = createLsCommand(context);

      const result = ls.fn('/home/jshacker/README.md');

      expect(result).toBe('README.md');
    });
  });

  describe('hidden files', () => {
    it('should not show hidden files by default', () => {
      const context = createMockContext('/home/jshacker');
      const ls = createLsCommand(context);

      const result = ls.fn();

      expect(result).not.toContain('.hidden');
      expect(result).toBe('notes.txt  README.md');
    });

    it('should show hidden files with -a option', () => {
      const context = createMockContext('/home/jshacker');
      const ls = createLsCommand(context);

      const result = ls.fn('-a');

      expect(result).toContain('.hidden');
      expect(result).toBe('.hidden  notes.txt  README.md');
    });

    it('should show hidden files with path and -a option', () => {
      const context = createMockContext('/');
      const ls = createLsCommand(context);

      const result = ls.fn('/home/jshacker', '-a');

      expect(result).toContain('.hidden');
    });

    it('should accept -a option before path', () => {
      const context = createMockContext('/');
      const ls = createLsCommand(context);

      const result = ls.fn('-a', '/home/jshacker');

      expect(result).toContain('.hidden');
    });
  });

  describe('sorting', () => {
    it('should sort entries alphabetically (case-insensitive)', () => {
      const context = createMockContext('/home/jshacker');
      const ls = createLsCommand(context);

      const result = ls.fn();

      // localeCompare sorts case-insensitively: n < r, so notes.txt before README.md
      expect(result).toBe('notes.txt  README.md');
    });

    it('should sort hidden files alphabetically with regular files', () => {
      const context = createMockContext('/home/jshacker');
      const ls = createLsCommand(context);

      const result = ls.fn('-a');

      // .hidden comes first (dot files sort before others), then n < r
      expect(result).toBe('.hidden  notes.txt  README.md');
    });
  });

  describe('error handling', () => {
    it('should throw error for non-existent path', () => {
      const context = createMockContext('/home/jshacker');
      const ls = createLsCommand(context);

      expect(() => ls.fn('/nonexistent')).toThrow(
        "ls: cannot access '/nonexistent': No such file or directory"
      );
    });

    it('should throw error for permission denied', () => {
      const context = createMockContext('/home/jshacker', 'guest');
      const ls = createLsCommand(context);

      expect(() => ls.fn('/root')).toThrow(
        "ls: cannot open directory '/root': Permission denied"
      );
    });

    it('should allow root to access restricted directories', () => {
      const context = createMockContext('/home/jshacker', 'root');
      const ls = createLsCommand(context);

      const result = ls.fn('/root', '-a');

      expect(result).toBe('.secret');
    });
  });

  describe('command metadata', () => {
    it('should have correct name and description', () => {
      const context = createMockContext();
      const ls = createLsCommand(context);

      expect(ls.name).toBe('ls');
      expect(ls.description).toBe('List directory contents');
    });

    it('should have manual with examples', () => {
      const context = createMockContext();
      const ls = createLsCommand(context);

      expect(ls.manual).toBeDefined();
      expect(ls.manual?.synopsis).toBe('ls([path: string], [options: string])');
      expect(ls.manual?.examples).toHaveLength(4);
    });
  });
});
