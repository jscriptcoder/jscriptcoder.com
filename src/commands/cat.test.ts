import { describe, it, expect, vi } from 'vitest';
import { createCatCommand } from './cat';
import type { FileNode } from '../filesystem/types';
import type { UserType } from '../context/SessionContext';

// Helper to create a mock file node
const createMockFile = (
  name: string,
  content: string,
  readPermissions: UserType[] = ['root', 'user']
): FileNode => ({
  name,
  type: 'file',
  owner: 'user',
  permissions: {
    read: readPermissions,
    write: ['root', 'user'],
  },
  content,
});

// Helper to create a mock directory node
const createMockDirectory = (
  name: string,
  children: Record<string, FileNode> = {}
): FileNode => ({
  name,
  type: 'directory',
  owner: 'root',
  permissions: {
    read: ['root', 'user', 'guest'],
    write: ['root'],
  },
  children,
});

// Create a mock file system for testing
const mockFileSystem: FileNode = createMockDirectory('/', {
  home: createMockDirectory('home', {
    jshacker: createMockDirectory('jshacker', {
      'README.md': createMockFile('README.md', '# Welcome\n\nThis is the readme.'),
      'empty.txt': createMockFile('empty.txt', ''),
      'notes.txt': createMockFile('notes.txt', 'Some notes here.'),
    }),
  }),
  etc: createMockDirectory('etc', {
    passwd: createMockFile('passwd', 'root:x:0:0:root:/root:/bin/bash\njshacker:x:1000:1000::/home/jshacker:/bin/bash'),
  }),
  root: createMockDirectory('root', {
    '.secret': createMockFile('.secret', 'FLAG{secret_flag}', ['root']),
  }),
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

describe('cat command', () => {
  const createMockContext = (
    currentPath = '/home/jshacker',
    userType: UserType = 'user'
  ) => ({
    resolvePath: vi.fn((path: string) => {
      if (path.startsWith('/')) return path;
      if (path === '..') {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        return '/' + parts.join('/') || '/';
      }
      if (path.startsWith('../')) {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        const parentPath = '/' + parts.join('/') || '/';
        return parentPath === '/' ? `/${path.slice(3)}` : `${parentPath}/${path.slice(3)}`;
      }
      return currentPath === '/' ? `/${path}` : `${currentPath}/${path}`;
    }),
    getNode: vi.fn((path: string) => getNodeFromPath(path)),
    getUserType: vi.fn(() => userType),
  });

  describe('basic functionality', () => {
    it('should display file contents with absolute path', () => {
      const context = createMockContext();
      const cat = createCatCommand(context);

      const result = cat.fn('/home/jshacker/README.md');

      expect(result).toBe('# Welcome\n\nThis is the readme.');
      expect(context.resolvePath).toHaveBeenCalledWith('/home/jshacker/README.md');
    });

    it('should display file contents with relative path', () => {
      const context = createMockContext('/home/jshacker');
      const cat = createCatCommand(context);

      const result = cat.fn('notes.txt');

      expect(result).toBe('Some notes here.');
      expect(context.resolvePath).toHaveBeenCalledWith('notes.txt');
    });

    it('should return empty string for empty file', () => {
      const context = createMockContext('/home/jshacker');
      const cat = createCatCommand(context);

      const result = cat.fn('empty.txt');

      expect(result).toBe('');
    });

    it('should display multi-line file contents', () => {
      const context = createMockContext();
      const cat = createCatCommand(context);

      const result = cat.fn('/etc/passwd') as string;

      expect(result).toContain('root:x:0:0');
      expect(result).toContain('jshacker:x:1000:1000');
      expect(result.split('\n')).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should throw error when path is missing', () => {
      const context = createMockContext();
      const cat = createCatCommand(context);

      expect(() => cat.fn()).toThrow('cat: missing file operand');
    });

    it('should throw error for non-existent file', () => {
      const context = createMockContext();
      const cat = createCatCommand(context);

      expect(() => cat.fn('/nonexistent')).toThrow(
        "cat: /nonexistent: No such file or directory"
      );
    });

    it('should throw error for non-existent relative path', () => {
      const context = createMockContext('/home/jshacker');
      const cat = createCatCommand(context);

      expect(() => cat.fn('missing.txt')).toThrow(
        "cat: missing.txt: No such file or directory"
      );
    });

    it('should throw error when trying to cat a directory', () => {
      const context = createMockContext();
      const cat = createCatCommand(context);

      expect(() => cat.fn('/home')).toThrow("cat: /home: Is a directory");
    });

    it('should throw error for permission denied', () => {
      const context = createMockContext('/home/jshacker', 'guest');
      const cat = createCatCommand(context);

      expect(() => cat.fn('/root/.secret')).toThrow(
        "cat: /root/.secret: Permission denied"
      );
    });

    it('should throw error for user without read permission', () => {
      const context = createMockContext('/home/jshacker', 'user');
      const cat = createCatCommand(context);

      expect(() => cat.fn('/root/.secret')).toThrow(
        "cat: /root/.secret: Permission denied"
      );
    });
  });

  describe('permissions', () => {
    it('should allow root to read any file', () => {
      const context = createMockContext('/home/jshacker', 'root');
      const cat = createCatCommand(context);

      const result = cat.fn('/root/.secret');

      expect(result).toBe('FLAG{secret_flag}');
    });

    it('should allow user to read files with user permission', () => {
      const context = createMockContext('/home/jshacker', 'user');
      const cat = createCatCommand(context);

      const result = cat.fn('/etc/passwd');

      expect(result).toContain('root:x:0:0');
    });
  });

  describe('command metadata', () => {
    it('should have correct name and description', () => {
      const context = createMockContext();
      const cat = createCatCommand(context);

      expect(cat.name).toBe('cat');
      expect(cat.description).toBe('Display file contents');
    });

    it('should have manual with synopsis and examples', () => {
      const context = createMockContext();
      const cat = createCatCommand(context);

      expect(cat.manual).toBeDefined();
      expect(cat.manual?.synopsis).toBe('cat(path: string)');
      expect(cat.manual?.arguments).toHaveLength(1);
      expect(cat.manual?.arguments?.[0].required).toBe(true);
      expect(cat.manual?.examples).toHaveLength(3);
    });
  });
});
