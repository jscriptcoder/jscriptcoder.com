import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { FileNode, PermissionResult } from './types';
import type { UserType } from '../context/SessionContext';
import { createInitialFileSystem } from './initialFileSystem';

interface FileSystemContextValue {
  fileSystem: FileNode;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  resolvePath: (path: string) => string;
  getNode: (path: string) => FileNode | null;
  canRead: (path: string, userType: UserType) => PermissionResult;
  canWrite: (path: string, userType: UserType) => PermissionResult;
  listDirectory: (path: string, userType: UserType) => string[] | null;
  readFile: (path: string, userType: UserType) => string | null;
  writeFile: (path: string, content: string, userType: UserType) => PermissionResult;
  createFile: (path: string, content: string, userType: UserType) => PermissionResult;
}

const FileSystemContext = createContext<FileSystemContextValue | null>(null);

export const FileSystemProvider = ({ children }: { children: ReactNode }) => {
  const [fileSystem, setFileSystem] = useState<FileNode>(createInitialFileSystem);
  const [currentPath, setCurrentPath] = useState('/home/jshacker');

  // Resolve relative paths to absolute paths
  const resolvePath = useCallback((path: string): string => {
    if (path.startsWith('/')) {
      // Absolute path
      return normalizePath(path);
    }

    // Relative path
    if (path === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/') || '/';
    }

    if (path === '.') {
      return currentPath;
    }

    // Handle paths with .. in them
    const combined = currentPath === '/' ? `/${path}` : `${currentPath}/${path}`;
    return normalizePath(combined);
  }, [currentPath]);

  // Normalize path (remove double slashes, resolve ..)
  const normalizePath = (path: string): string => {
    const parts = path.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else if (part !== '.') {
        resolved.push(part);
      }
    }

    return '/' + resolved.join('/');
  };

  // Get a node at a specific path
  const getNode = useCallback((path: string): FileNode | null => {
    const resolvedPath = path.startsWith('/') ? path : resolvePath(path);
    const parts = resolvedPath.split('/').filter(Boolean);

    let current: FileNode = fileSystem;

    for (const part of parts) {
      if (current.type !== 'directory' || !current.children) {
        return null;
      }
      const child = current.children[part];
      if (!child) {
        return null;
      }
      current = child;
    }

    return current;
  }, [fileSystem, resolvePath]);

  // Check read permission
  const canRead = useCallback((path: string, userType: UserType): PermissionResult => {
    const node = getNode(path);
    if (!node) {
      return { allowed: false, error: `No such file or directory: ${path}` };
    }
    if (!node.permissions.read.includes(userType)) {
      return { allowed: false, error: `Permission denied: ${path}` };
    }
    return { allowed: true };
  }, [getNode]);

  // Check write permission
  const canWrite = useCallback((path: string, userType: UserType): PermissionResult => {
    const node = getNode(path);
    if (!node) {
      return { allowed: false, error: `No such file or directory: ${path}` };
    }
    if (!node.permissions.write.includes(userType)) {
      return { allowed: false, error: `Permission denied: ${path}` };
    }
    return { allowed: true };
  }, [getNode]);

  // List directory contents
  const listDirectory = useCallback((path: string, userType: UserType): string[] | null => {
    const permission = canRead(path, userType);
    if (!permission.allowed) {
      return null;
    }

    const node = getNode(path);
    if (!node || node.type !== 'directory' || !node.children) {
      return null;
    }

    return Object.keys(node.children).sort();
  }, [canRead, getNode]);

  // Read file contents
  const readFile = useCallback((path: string, userType: UserType): string | null => {
    const permission = canRead(path, userType);
    if (!permission.allowed) {
      return null;
    }

    const node = getNode(path);
    if (!node || node.type !== 'file') {
      return null;
    }

    return node.content ?? '';
  }, [canRead, getNode]);

  // Write to existing file
  const writeFile = useCallback((path: string, content: string, userType: UserType): PermissionResult => {
    const permission = canWrite(path, userType);
    if (!permission.allowed) {
      return permission;
    }

    const node = getNode(path);
    if (!node || node.type !== 'file') {
      return { allowed: false, error: `Not a file: ${path}` };
    }

    // Update file content (immutable update)
    setFileSystem((prev) => {
      const newFs = JSON.parse(JSON.stringify(prev)) as FileNode;
      const parts = path.split('/').filter(Boolean);
      let current = newFs;

      for (let i = 0; i < parts.length - 1; i++) {
        current = current.children![parts[i]];
      }

      current.children![parts[parts.length - 1]].content = content;
      return newFs;
    });

    return { allowed: true };
  }, [canWrite, getNode]);

  // Create new file
  const createFile = useCallback((path: string, content: string, userType: UserType): PermissionResult => {
    const resolvedPath = resolvePath(path);
    const parts = resolvedPath.split('/').filter(Boolean);
    const fileName = parts.pop()!;
    const dirPath = '/' + parts.join('/') || '/';

    // Check if parent directory exists and is writable
    const parentPermission = canWrite(dirPath, userType);
    if (!parentPermission.allowed) {
      return parentPermission;
    }

    const parentNode = getNode(dirPath);
    if (!parentNode || parentNode.type !== 'directory') {
      return { allowed: false, error: `Not a directory: ${dirPath}` };
    }

    // Check if file already exists
    if (parentNode.children && parentNode.children[fileName]) {
      return { allowed: false, error: `File exists: ${path}` };
    }

    // Create the file
    setFileSystem((prev) => {
      const newFs = JSON.parse(JSON.stringify(prev)) as FileNode;
      const pathParts = dirPath.split('/').filter(Boolean);
      let current = newFs;

      for (const part of pathParts) {
        current = current.children![part];
      }

      current.children![fileName] = {
        name: fileName,
        type: 'file',
        owner: userType,
        permissions: {
          read: ['root', userType],
          write: ['root', userType],
        },
        content,
      };

      return newFs;
    });

    return { allowed: true };
  }, [resolvePath, canWrite, getNode]);

  return (
    <FileSystemContext.Provider
      value={{
        fileSystem,
        currentPath,
        setCurrentPath,
        resolvePath,
        getNode,
        canRead,
        canWrite,
        listDirectory,
        readFile,
        writeFile,
        createFile,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = (): FileSystemContextValue => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};
