import type { Command } from '../../components/Terminal/types';
import type { FileNode } from '../../filesystem/types';
import type { UserType } from '../../context/SessionContext';
import type { MachineId } from '../../filesystem/machineFileSystems';

type FtpLcdContext = {
  readonly getOriginMachine: () => MachineId;
  readonly getOriginCwd: () => string;
  readonly getOriginUserType: () => UserType;
  readonly setOriginCwd: (cwd: string) => void;
  readonly resolvePathForMachine: (path: string, cwd: string) => string;
  readonly getNodeFromMachine: (machineId: MachineId, path: string, cwd: string) => FileNode | null;
};

export const createFtpLcdCommand = (context: FtpLcdContext): Command => ({
  name: 'lcd',
  description: 'Change local directory',
  manual: {
    synopsis: 'lcd([path])',
    description: 'Change the current working directory on the local machine (where the FTP connection was initiated from).',
    arguments: [
      { name: 'path', description: 'Directory to change to (optional)', required: false },
    ],
    examples: [
      { command: 'lcd("/home/jshacker")', description: 'Change to home directory on local machine' },
      { command: 'lcd("/tmp")', description: 'Change to /tmp on local machine' },
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
      throw new Error(`lcd: ${targetPath}: No such file or directory`);
    }
    if (node.type !== 'directory') {
      throw new Error(`lcd: ${targetPath}: Not a directory`);
    }
    if (!node.permissions.read.includes(userType)) {
      throw new Error(`lcd: ${targetPath}: Permission denied`);
    }

    context.setOriginCwd(resolvedPath);
    return `Local directory changed to ${resolvedPath}`;
  },
});
