import type { FileNode } from './types';
import {
  localhost,
  gateway,
  fileserver,
  webserver,
  darknet,
  shadow,
  voidFs,
  abyss,
} from './machines';

export type MachineId =
  | 'localhost'
  | '192.168.1.1'
  | '192.168.1.50'
  | '192.168.1.75'
  | '203.0.113.42'
  | '10.66.66.1'
  | '10.66.66.2'
  | '10.66.66.3';

export const machineFileSystems: Readonly<Record<MachineId, FileNode>> = {
  localhost,
  '192.168.1.1': gateway,
  '192.168.1.50': fileserver,
  '192.168.1.75': webserver,
  '203.0.113.42': darknet,
  '10.66.66.1': shadow,
  '10.66.66.2': voidFs,
  '10.66.66.3': abyss,
};

export const getDefaultHomePath = (_machineId: string, username: string): string => {
  if (username === 'root') return '/root';
  return `/home/${username}`;
};
