import type { FileNode } from './types';
import { localhost, gateway, fileserver, webserver, darknet } from './machines';

export type MachineId =
  | 'localhost'
  | '192.168.1.1'
  | '192.168.1.50'
  | '192.168.1.75'
  | '203.0.113.42';

export const machineFileSystems: Readonly<Record<MachineId, FileNode>> = {
  localhost,
  '192.168.1.1': gateway,
  '192.168.1.50': fileserver,
  '192.168.1.75': webserver,
  '203.0.113.42': darknet,
};

export const getDefaultHomePath = (_machineId: string, username: string): string => {
  if (username === 'root') return '/root';
  return `/home/${username}`;
};
