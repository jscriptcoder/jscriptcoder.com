import type { Command } from '../components/Terminal/types';
import type { UserType } from '../context/SessionContext';
import type { FileNode } from '../filesystem/types';

interface CatContext {
  resolvePath: (path: string) => string;
  getNode: (path: string) => FileNode | null;
  getUserType: () => UserType;
}

export const createCatCommand = (context: CatContext): Command => ({
  name: 'cat',
  description: 'Display file contents',
  fn: (...args: unknown[]): string => {
    const path = args[0] as string | undefined;
    if (!path) {
      throw new Error('cat: missing file operand');
    }

    const { resolvePath, getNode, getUserType } = context;
    const userType = getUserType();
    const targetPath = resolvePath(path);
    const node = getNode(targetPath);

    if (!node) {
      throw new Error(`cat: ${path}: No such file or directory`);
    }

    if (node.type === 'directory') {
      throw new Error(`cat: ${path}: Is a directory`);
    }

    // Check read permission
    if (!node.permissions.read.includes(userType)) {
      throw new Error(`cat: ${path}: Permission denied`);
    }

    return node.content ?? '';
  },
});
