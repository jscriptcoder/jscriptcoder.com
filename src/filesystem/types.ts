import type { UserType } from '../context/SessionContext';

export interface FilePermissions {
  read: UserType[];
  write: UserType[];
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  owner: UserType;
  permissions: FilePermissions;
  content?: string; // For files
  children?: Record<string, FileNode>; // For directories
}

export interface FileSystem {
  root: FileNode;
}

// Permission check results
export interface PermissionResult {
  allowed: boolean;
  error?: string;
}
