import type { Command } from '../../components/Terminal/types';
import type { FileNode, PermissionResult } from '../../filesystem/types';
import type { UserType } from '../../context/SessionContext';
import type { MachineId } from '../../filesystem/machineFileSystems';

type FtpPutContext = {
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

export const createFtpPutCommand = (context: FtpPutContext): Command => ({
  name: 'put',
  description: 'Upload file to remote server',
  manual: {
    synopsis: 'put(localFile, [remotePath])',
    description:
      'Upload a file from the local machine to the remote FTP server. ' +
      'If remotePath is not specified, the file is saved in the current remote directory with the same name.',
    arguments: [
      { name: 'localFile', description: 'Path to the file on the local machine', required: true },
      { name: 'remotePath', description: 'Destination path on remote server (optional)', required: false },
    ],
    examples: [
      { command: 'put("/home/jshacker/payload.sh")', description: 'Upload to current remote directory' },
      { command: 'put("/tmp/data.txt", "/srv/ftp/uploads/data.txt")', description: 'Upload to specific remote path' },
    ],
  },
  fn: (localFile?: unknown, remotePath?: unknown): string => {
    if (typeof localFile !== 'string' || !localFile) {
      throw new Error('put: missing local file argument\nUsage: put("localFile", ["remotePath"])');
    }

    const remoteMachine = context.getRemoteMachine();
    const remoteCwd = context.getRemoteCwd();
    const remoteUserType = context.getRemoteUserType();

    const originMachine = context.getOriginMachine();
    const originCwd = context.getOriginCwd();
    const originUserType = context.getOriginUserType();

    // Resolve local path
    const resolvedLocalPath = context.resolvePathForMachine(localFile, originCwd);

    // Check local file exists and is readable
    const localNode = context.getNodeFromMachine(originMachine, resolvedLocalPath, '/');
    if (!localNode) {
      throw new Error(`put: ${localFile}: No such file or directory`);
    }
    if (localNode.type !== 'file') {
      throw new Error(`put: ${localFile}: Is a directory`);
    }

    // Read local file content
    const content = context.readFileFromMachine(originMachine, resolvedLocalPath, '/', originUserType);
    if (content === null) {
      throw new Error(`put: ${localFile}: Permission denied`);
    }

    // Determine remote destination
    const fileName = resolvedLocalPath.split('/').pop() ?? localFile;
    const remoteDestination = typeof remotePath === 'string'
      ? remotePath
      : (remoteCwd === '/' ? `/${fileName}` : `${remoteCwd}/${fileName}`);
    const resolvedRemotePath = context.resolvePathForMachine(remoteDestination, remoteCwd);

    // Check if remote file already exists
    const remoteNode = context.getNodeFromMachine(remoteMachine, resolvedRemotePath, '/');

    if (remoteNode) {
      // File exists - try to overwrite
      if (remoteNode.type !== 'file') {
        throw new Error(`put: remote path ${remoteDestination}: Is a directory`);
      }
      const writeResult = context.writeFileToMachine(remoteMachine, resolvedRemotePath, '/', content, remoteUserType);
      if (!writeResult.allowed) {
        throw new Error(`put: remote path ${remoteDestination}: ${writeResult.error}`);
      }
    } else {
      // File doesn't exist - create it
      const createResult = context.createFileOnMachine(remoteMachine, resolvedRemotePath, '/', content, remoteUserType);
      if (!createResult.allowed) {
        throw new Error(`put: remote path ${remoteDestination}: ${createResult.error}`);
      }
    }

    const bytes = content.length;
    return `Uploaded ${fileName} (${bytes} bytes) to ${resolvedRemotePath}`;
  },
});
