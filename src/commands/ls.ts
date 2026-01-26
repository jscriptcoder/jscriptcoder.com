import type { Command } from '../components/Terminal/types';
import type { UserType } from '../context/SessionContext';
import type { FileNode } from '../filesystem/types';

interface LsContext {
  getCurrentPath: () => string;
  resolvePath: (path: string) => string;
  getNode: (path: string) => FileNode | null;
  getUserType: () => UserType;
}

export const createLsCommand = (context: LsContext): Command => ({
  name: 'ls',
  description: 'List directory contents',
  manual: {
    synopsis: 'ls([path: string])',
    description: 'List the contents of a directory. Directories are shown with a trailing slash. If no path is specified, lists the current directory.',
    arguments: [
      { name: 'path', description: 'Path to the directory to list (absolute or relative)', required: false },
    ],
    examples: [
      { command: 'ls()', description: 'List contents of current directory' },
      { command: 'ls("/")', description: 'List contents of root directory' },
      { command: 'ls("/home")', description: 'List contents of /home directory' },
      { command: 'ls("..")', description: 'List contents of parent directory' },
    ],
  },
  fn: (...args: unknown[]): string => {
    const path = args[0] as string | undefined;
    const { getCurrentPath, resolvePath, getNode, getUserType } = context;
    const userType = getUserType();
    const targetPath = path ? resolvePath(path) : getCurrentPath();
    const node = getNode(targetPath);

    if (!node) {
      throw new Error(`ls: cannot access '${targetPath}': No such file or directory`);
    }

    if (node.type === 'file') {
      // If it's a file, just return the file name
      return node.name;
    }

    // Check read permission
    if (!node.permissions.read.includes(userType)) {
      throw new Error(`ls: cannot open directory '${targetPath}': Permission denied`);
    }

    if (!node.children || Object.keys(node.children).length === 0) {
      return ''; // Empty directory
    }

    // Format output with directories marked
    const entries = Object.values(node.children)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((child) => {
        if (child.type === 'directory') {
          return `${child.name}/`;
        }
        return child.name;
      });

    return entries.join('  ');
  },
});
