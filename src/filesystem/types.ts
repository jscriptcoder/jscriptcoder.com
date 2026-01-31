import type { UserType } from '../context/SessionContext';

export interface FilePermissions {
  readonly read: readonly UserType[];
  readonly write: readonly UserType[];
}

export interface FileNode {
  readonly name: string;
  readonly type: 'file' | 'directory';
  readonly owner: UserType;
  readonly permissions: FilePermissions;
  readonly content?: string;
  readonly children?: Readonly<Record<string, FileNode>>;
}

export interface FileSystem {
  readonly root: FileNode;
}

export interface PermissionResult {
  readonly allowed: boolean;
  readonly error?: string;
}
