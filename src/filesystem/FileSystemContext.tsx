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

const updateNodeAtPath = (
  root: FileNode,
  pathParts: readonly string[],
  updater: (node: FileNode) => FileNode
): FileNode => {
  if (pathParts.length === 0) return updater(root);

  const [first, ...rest] = pathParts;
  if (root.type !== 'directory' || !root.children) return root;

  return {
    ...root,
    children: {
      ...root.children,
      [first]: updateNodeAtPath(root.children[first], rest, updater),
    },
  };
};

const addChildAtPath = (
  root: FileNode,
  pathParts: readonly string[],
  childName: string,
  child: FileNode
): FileNode => {
  if (pathParts.length === 0) {
    if (root.type !== 'directory') return root;
    return {
      ...root,
      children: {
        ...root.children,
        [childName]: child,
      },
    };
  }

  const [first, ...rest] = pathParts;
  if (root.type !== 'directory' || !root.children) return root;

  return {
    ...root,
    children: {
      ...root.children,
      [first]: addChildAtPath(root.children[first], rest, childName, child),
    },
  };
};

export const FileSystemProvider = ({ children }: { children: ReactNode }) => {
  const [fileSystem, setFileSystem] = useState<FileNode>(createInitialFileSystem);
  const [currentPath, setCurrentPath] = useState('/home/jshacker');

  const normalizePath = (path: string): string => {
    const parts = path.split('/').filter(Boolean);
    const resolved = parts.reduce<readonly string[]>((acc, part) => {
      if (part === '..') return acc.slice(0, -1);
      if (part !== '.') return [...acc, part];
      return acc;
    }, []);
    return '/' + resolved.join('/');
  };

  const resolvePath = useCallback((path: string): string => {
    if (path.startsWith('/')) return normalizePath(path);
    if (path === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      return '/' + parts.slice(0, -1).join('/') || '/';
    }
    if (path === '.') return currentPath;
    const combined = currentPath === '/' ? `/${path}` : `${currentPath}/${path}`;
    return normalizePath(combined);
  }, [currentPath]);

  const getNode = useCallback((path: string): FileNode | null => {
    const resolvedPath = path.startsWith('/') ? path : resolvePath(path);
    const parts = resolvedPath.split('/').filter(Boolean);

    return parts.reduce<FileNode | null>((current, part) => {
      if (!current || current.type !== 'directory' || !current.children) return null;
      return current.children[part] ?? null;
    }, fileSystem);
  }, [fileSystem, resolvePath]);

  const canRead = useCallback((path: string, userType: UserType): PermissionResult => {
    const node = getNode(path);
    if (!node) return { allowed: false, error: `No such file or directory: ${path}` };
    if (!node.permissions.read.includes(userType)) return { allowed: false, error: `Permission denied: ${path}` };
    return { allowed: true };
  }, [getNode]);

  const canWrite = useCallback((path: string, userType: UserType): PermissionResult => {
    const node = getNode(path);
    if (!node) return { allowed: false, error: `No such file or directory: ${path}` };
    if (!node.permissions.write.includes(userType)) return { allowed: false, error: `Permission denied: ${path}` };
    return { allowed: true };
  }, [getNode]);

  const listDirectory = useCallback((path: string, userType: UserType): string[] | null => {
    const permission = canRead(path, userType);
    if (!permission.allowed) return null;

    const node = getNode(path);
    if (!node || node.type !== 'directory' || !node.children) return null;

    return Object.keys(node.children).sort();
  }, [canRead, getNode]);

  const readFile = useCallback((path: string, userType: UserType): string | null => {
    const permission = canRead(path, userType);
    if (!permission.allowed) return null;

    const node = getNode(path);
    if (!node || node.type !== 'file') return null;

    return node.content ?? '';
  }, [canRead, getNode]);

  const writeFile = useCallback((path: string, content: string, userType: UserType): PermissionResult => {
    const permission = canWrite(path, userType);
    if (!permission.allowed) return permission;

    const node = getNode(path);
    if (!node || node.type !== 'file') return { allowed: false, error: `Not a file: ${path}` };

    const parts = path.split('/').filter(Boolean);
    setFileSystem((prev) =>
      updateNodeAtPath(prev, parts, (fileNode) => ({ ...fileNode, content }))
    );

    return { allowed: true };
  }, [canWrite, getNode]);

  const createFile = useCallback((path: string, content: string, userType: UserType): PermissionResult => {
    const resolvedPath = resolvePath(path);
    const parts = resolvedPath.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];
    const dirParts = parts.slice(0, -1);
    const dirPath = '/' + dirParts.join('/') || '/';

    const parentPermission = canWrite(dirPath, userType);
    if (!parentPermission.allowed) return parentPermission;

    const parentNode = getNode(dirPath);
    if (!parentNode || parentNode.type !== 'directory') return { allowed: false, error: `Not a directory: ${dirPath}` };
    if (parentNode.children?.[fileName]) return { allowed: false, error: `File exists: ${path}` };

    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      owner: userType,
      permissions: {
        read: ['root', userType],
        write: ['root', userType],
      },
      content,
    };

    setFileSystem((prev) => addChildAtPath(prev, dirParts, fileName, newFile));

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
