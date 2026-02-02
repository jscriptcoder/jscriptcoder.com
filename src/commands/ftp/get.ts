import type { Command } from '../../components/Terminal/types';
import type { FileNode, PermissionResult } from '../../filesystem/types';
import type { UserType } from '../../context/SessionContext';
import type { MachineId } from '../../filesystem/machineFileSystems';

type FtpGetContext = {
  readonly getRemoteMachine: () => MachineId;
  readonly getRemoteCwd: () => string;
  readonly getRemoteUserType: () => UserType;
  readonly getOriginMachine: () => MachineId;
  readonly getOriginCwd: () => string;
  readonly getOriginUserType: () => UserType;
  readonly resolvePathForMachine: (path: string, cwd: string) => string;
  readonly getNodeFromMachine: (machineId: MachineId, path: string, cwd: string) => FileNode | null;
  readonly readFileFromMachine: (machineId: MachineId, path: string, cwd: string, userType: UserType) => string | null;
  readonly createFileOnMachine: (machineId: MachineId, path: string, cwd: string, content: string, userType: UserType) => PermissionResult;
  readonly writeFileToMachine: (machineId: MachineId, path: string, cwd: string, content: string, userType: UserType) => PermissionResult;
};

export const createFtpGetCommand = (context: FtpGetContext): Command => ({
  name: 'get',
  description: 'Download file from remote server',
  manual: {
    synopsis: 'get(remoteFile, [localPath])',
    description:
      'Download a file from the remote FTP server to the local machine. ' +
      'If localPath is not specified, the file is saved in the current local directory with the same name.',
    arguments: [
      { name: 'remoteFile', description: 'Path to the file on the remote server', required: true },
      { name: 'localPath', description: 'Destination path on local machine (optional)', required: false },
    ],
    examples: [
      { command: 'get("secret.txt")', description: 'Download secret.txt to current local directory' },
      { command: 'get("data.txt", "/home/jshacker/downloads/data.txt")', description: 'Download to specific local path' },
    ],
  },
  fn: (remoteFile?: unknown, localPath?: unknown): string => {
    if (typeof remoteFile !== 'string' || !remoteFile) {
      throw new Error('get: missing remote file argument\nUsage: get("remoteFile", ["localPath"])');
    }

    const remoteMachine = context.getRemoteMachine();
    const remoteCwd = context.getRemoteCwd();
    const remoteUserType = context.getRemoteUserType();

    const originMachine = context.getOriginMachine();
    const originCwd = context.getOriginCwd();
    const originUserType = context.getOriginUserType();

    // Resolve remote path
    const resolvedRemotePath = context.resolvePathForMachine(remoteFile, remoteCwd);

    // Check remote file exists and is readable
    const remoteNode = context.getNodeFromMachine(remoteMachine, resolvedRemotePath, '/');
    if (!remoteNode) {
      throw new Error(`get: ${remoteFile}: No such file or directory`);
    }
    if (remoteNode.type !== 'file') {
      throw new Error(`get: ${remoteFile}: Is a directory`);
    }

    // Read remote file content
    const content = context.readFileFromMachine(remoteMachine, resolvedRemotePath, '/', remoteUserType);
    if (content === null) {
      throw new Error(`get: ${remoteFile}: Permission denied`);
    }

    // Determine local destination
    const fileName = resolvedRemotePath.split('/').pop() ?? remoteFile;
    const localDestination = typeof localPath === 'string'
      ? localPath
      : (originCwd === '/' ? `/${fileName}` : `${originCwd}/${fileName}`);
    const resolvedLocalPath = context.resolvePathForMachine(localDestination, originCwd);

    // Check if local file already exists
    const localNode = context.getNodeFromMachine(originMachine, resolvedLocalPath, '/');

    if (localNode) {
      // File exists - try to overwrite
      if (localNode.type !== 'file') {
        throw new Error(`get: local path ${localDestination}: Is a directory`);
      }
      const writeResult = context.writeFileToMachine(originMachine, resolvedLocalPath, '/', content, originUserType);
      if (!writeResult.allowed) {
        throw new Error(`get: local path ${localDestination}: ${writeResult.error}`);
      }
    } else {
      // File doesn't exist - create it
      const createResult = context.createFileOnMachine(originMachine, resolvedLocalPath, '/', content, originUserType);
      if (!createResult.allowed) {
        throw new Error(`get: local path ${localDestination}: ${createResult.error}`);
      }
    }

    const bytes = content.length;
    return `Downloaded ${fileName} (${bytes} bytes) to ${resolvedLocalPath}`;
  },
});
