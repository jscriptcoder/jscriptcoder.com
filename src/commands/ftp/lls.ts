import type { Command } from '../../components/Terminal/types';
import type { FileNode } from '../../filesystem/types';
import type { UserType } from '../../context/SessionContext';
import type { MachineId } from '../../filesystem/machineFileSystems';

type FtpLlsContext = {
  readonly getOriginMachine: () => MachineId;
  readonly getOriginCwd: () => string;
  readonly getOriginUserType: () => UserType;
  readonly resolvePathForMachine: (path: string, cwd: string) => string;
  readonly getNodeFromMachine: (machineId: MachineId, path: string, cwd: string) => FileNode | null;
  readonly listDirectoryFromMachine: (machineId: MachineId, path: string, cwd: string, userType: UserType) => string[] | null;
};

export const createFtpLlsCommand = (context: FtpLlsContext): Command => ({
  name: 'lls',
  description: 'List local directory contents',
  manual: {
    synopsis: 'lls([path])',
    description: 'List the contents of a directory on the local machine (where the FTP connection was initiated from). If no path is given, lists the current local directory.',
    arguments: [
      { name: 'path', description: 'Directory to list (optional, defaults to current local directory)', required: false },
    ],
    examples: [
      { command: 'lls()', description: 'List current local directory' },
      { command: 'lls("/home/jshacker")', description: 'List /home/jshacker on local machine' },
    ],
  },
  fn: (path?: unknown): string => {
    const originMachine = context.getOriginMachine();
    const originCwd = context.getOriginCwd();
    const userType = context.getOriginUserType();

    const targetPath = typeof path === 'string' ? path : originCwd;
    const resolvedPath = context.resolvePathForMachine(targetPath, originCwd);

    const node = context.getNodeFromMachine(originMachine, resolvedPath, '/');
    if (!node) {
      throw new Error(`lls: ${targetPath}: No such file or directory`);
    }
    if (!node.permissions.read.includes(userType)) {
      throw new Error(`lls: ${targetPath}: Permission denied`);
    }

    if (node.type === 'file') {
      return node.name;
    }

    const entries = context.listDirectoryFromMachine(originMachine, resolvedPath, '/', userType);
    if (!entries) {
      throw new Error(`lls: ${targetPath}: Permission denied`);
    }

    if (entries.length === 0) {
      return '(empty directory)';
    }

    // Format entries with type indicators
    const formattedEntries = entries.map((entry) => {
      const entryPath = resolvedPath === '/' ? `/${entry}` : `${resolvedPath}/${entry}`;
      const entryNode = context.getNodeFromMachine(originMachine, entryPath, '/');
      if (entryNode?.type === 'directory') {
        return `${entry}/`;
      }
      return entry;
    });

    return formattedEntries.join('  ');
  },
});
