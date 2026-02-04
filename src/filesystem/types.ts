import type { UserType } from '../session/SessionContext';

export type FilePermissions = {
  readonly read: readonly UserType[];
  readonly write: readonly UserType[];
};

export type FileNode = {
  readonly name: string;
  readonly type: 'file' | 'directory';
  readonly owner: UserType;
  readonly permissions: FilePermissions;
  readonly content?: string;
  readonly children?: Readonly<Record<string, FileNode>>;
};

export type FileSystem = {
  readonly root: FileNode;
};

export type PermissionResult = {
  readonly allowed: boolean;
  readonly error?: string;
};
