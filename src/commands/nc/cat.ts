import type { Command } from '../../components/Terminal/types';
import type { FileNode } from '../../filesystem/types';
import type { UserType } from '../../session/SessionContext';
import type { MachineId } from '../../filesystem/machineFileSystems';

type NcCatContext = {
  readonly getMachine: () => MachineId;
  readonly getCwd: () => string;
  readonly getUserType: () => UserType;
  readonly resolvePath: (path: string, cwd: string) => string;
  readonly getNodeFromMachine: (machineId: MachineId, path: string, cwd: string) => FileNode | null;
  readonly readFileFromMachine: (machineId: MachineId, path: string, cwd: string, userType: UserType) => string | null;
};

export const createNcCatCommand = (context: NcCatContext): Command => ({
  name: 'cat',
  description: 'Read file contents',
  fn: (...args: unknown[]): string => {
    const {
      getMachine,
      getCwd,
      getUserType,
      resolvePath,
      getNodeFromMachine,
      readFileFromMachine,
    } = context;

    const path = args[0] as string | undefined;

    if (!path) {
      throw new Error('cat: missing filename');
    }

    const machine = getMachine();
    const cwd = getCwd();
    const userType = getUserType();

    const resolvedPath = resolvePath(path, cwd);

    // Check if file exists
    const node = getNodeFromMachine(machine, resolvedPath, cwd);
    if (!node) {
      throw new Error(`cat: ${path}: No such file or directory`);
    }

    // Check if it's a file
    if (node.type === 'directory') {
      throw new Error(`cat: ${path}: Is a directory`);
    }

    // Try to read the file
    const content = readFileFromMachine(machine, resolvedPath, cwd, userType);
    if (content === null) {
      throw new Error(`cat: ${path}: Permission denied`);
    }

    return content;
  },
});
