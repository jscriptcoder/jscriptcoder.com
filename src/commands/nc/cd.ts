import type { Command } from '../../components/Terminal/types';
import type { FileNode } from '../../filesystem/types';
import type { UserType } from '../../session/SessionContext';
import type { MachineId } from '../../filesystem/machineFileSystems';

type NcCdContext = {
  readonly getMachine: () => MachineId;
  readonly getCwd: () => string;
  readonly getUserType: () => UserType;
  readonly setCwd: (path: string) => void;
  readonly resolvePath: (path: string, cwd: string) => string;
  readonly getNodeFromMachine: (machineId: MachineId, path: string, cwd: string) => FileNode | null;
};

export const createNcCdCommand = (context: NcCdContext): Command => ({
  name: 'cd',
  description: 'Change directory',
  fn: (...args: unknown[]): string => {
    const { getMachine, getCwd, getUserType, setCwd, resolvePath, getNodeFromMachine } = context;

    const path = (args[0] as string | undefined) ?? '/';
    const machine = getMachine();
    const cwd = getCwd();
    const userType = getUserType();
    const resolvedPath = resolvePath(path, cwd);

    // Check if path exists
    const node = getNodeFromMachine(machine, resolvedPath, cwd);
    if (!node) {
      throw new Error(`cd: ${path}: No such file or directory`);
    }

    // Check if it's a directory
    if (node.type !== 'directory') {
      throw new Error(`cd: ${path}: Not a directory`);
    }

    // Check permissions
    const canRead = node.permissions.read.includes(userType) || userType === 'root';
    if (!canRead) {
      throw new Error(`cd: ${path}: Permission denied`);
    }

    setCwd(resolvedPath);
    return '';
  },
});
