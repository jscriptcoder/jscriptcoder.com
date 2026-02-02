import type { Command } from '../../components/Terminal/types';
import type { FileNode } from '../../filesystem/types';
import type { UserType } from '../../context/SessionContext';
import type { MachineId } from '../../filesystem/machineFileSystems';

type FtpCdContext = {
  readonly getRemoteMachine: () => MachineId;
  readonly getRemoteCwd: () => string;
  readonly getRemoteUserType: () => UserType;
  readonly setRemoteCwd: (cwd: string) => void;
  readonly resolvePathForMachine: (path: string, cwd: string) => string;
  readonly getNodeFromMachine: (machineId: MachineId, path: string, cwd: string) => FileNode | null;
};

export const createFtpCdCommand = (context: FtpCdContext): Command => ({
  name: 'cd',
  description: 'Change remote directory',
  manual: {
    synopsis: 'cd([path])',
    description: 'Change the current working directory on the remote FTP server. If no path is given, returns to the home directory.',
    arguments: [
      { name: 'path', description: 'Directory to change to (optional)', required: false },
    ],
    examples: [
      { command: 'cd("/srv/ftp")', description: 'Change to /srv/ftp on remote' },
      { command: 'cd("..")', description: 'Go up one directory' },
    ],
  },
  fn: (path?: unknown): string => {
    const remoteMachine = context.getRemoteMachine();
    const remoteCwd = context.getRemoteCwd();
    const userType = context.getRemoteUserType();

    const targetPath = typeof path === 'string' ? path : remoteCwd;
    const resolvedPath = context.resolvePathForMachine(targetPath, remoteCwd);

    const node = context.getNodeFromMachine(remoteMachine, resolvedPath, '/');
    if (!node) {
      throw new Error(`cd: ${targetPath}: No such file or directory`);
    }
    if (node.type !== 'directory') {
      throw new Error(`cd: ${targetPath}: Not a directory`);
    }
    if (!node.permissions.read.includes(userType)) {
      throw new Error(`cd: ${targetPath}: Permission denied`);
    }

    context.setRemoteCwd(resolvedPath);
    return `Remote directory changed to ${resolvedPath}`;
  },
});
