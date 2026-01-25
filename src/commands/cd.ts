import type { Command } from '../components/Terminal/types';
import type { UserType } from '../context/SessionContext';
import type { FileNode } from '../filesystem/types';

interface CdContext {
  resolvePath: (path: string) => string;
  getNode: (path: string) => FileNode | null;
  setCurrentPath: (path: string) => void;
  getUserType: () => UserType;
  getHomePath: () => string;
}

export const createCdCommand = (context: CdContext): Command => ({
  name: 'cd',
  description: 'Change current directory',
  fn: (...args: unknown[]): undefined => {
    const path = args[0] as string | undefined;
    const { resolvePath, getNode, setCurrentPath, getUserType, getHomePath } = context;
    const userType = getUserType();

    // cd with no args goes to home directory
    const targetPath = path ? resolvePath(path) : getHomePath();
    const node = getNode(targetPath);

    if (!node) {
      throw new Error(`cd: ${path}: No such file or directory`);
    }

    if (node.type !== 'directory') {
      throw new Error(`cd: ${path}: Not a directory`);
    }

    // Check read permission (need to be able to enter the directory)
    if (!node.permissions.read.includes(userType)) {
      throw new Error(`cd: ${path}: Permission denied`);
    }

    setCurrentPath(targetPath);
    return undefined; // cd doesn't print output
  },
});
