import type { FileNode } from './types';
import { createFileSystem, type MachineFileSystemConfig } from './fileSystemFactory';

// ============================================================================
// LOCALHOST (192.168.1.100)
// ============================================================================

const localhostConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: 'a0ff67e77425eb3cea40ecb60941aea4', userType: 'root', uid: 0 }, // sup3rus3r
    { username: 'jshacker', passwordHash: '25cd52d0d5975297e6c28700caa9dd72', userType: 'user', uid: 1000 }, // h4ckth3pl4n3t
    { username: 'guest', passwordHash: '0fb9cbecb7b8881511c69c39db643e8c', userType: 'guest', uid: 1001 }, // guestpass
  ],
  passwdReadableBy: ['root', 'user'],
};

// ============================================================================
// GATEWAY (192.168.1.1)
// ============================================================================

const gatewayConfig: MachineFileSystemConfig = {
  users: [
    { username: 'admin', passwordHash: 'dab569cb96513965ca00379d69b2f40c', userType: 'root', uid: 0 }, // n3tgu4rd!
    { username: 'guest', passwordHash: 'dbf0171774108c80c94819b1ce0dbd9b', userType: 'guest', uid: 1001 }, // guest2024
  ],
};

// ============================================================================
// FILESERVER (192.168.1.50)
// ============================================================================

const fileserverConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: '4a080e0e088d55294ab894a02b5c8e3f', userType: 'root', uid: 0 }, // b4ckup2024
    { username: 'ftpuser', passwordHash: 'be7a9d8e813210208cb7fba28717cda7', userType: 'user', uid: 1000 }, // tr4nsf3r
    { username: 'guest', passwordHash: '294de3557d9d00b3d2d8a1e6aab028cf', userType: 'guest', uid: 1001 }, // anonymous
  ],
};

// ============================================================================
// WEBSERVER (192.168.1.75)
// ============================================================================

const webserverConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: 'a6f6c10dc3602b020c56ff49fb043ca9', userType: 'root', uid: 0 }, // r00tW3b!
    { username: 'www-data', passwordHash: 'd2d8d0cdf38ea5a54439ffadf7597722', userType: 'user', uid: 1000 }, // d3v0ps2024
    { username: 'guest', passwordHash: 'b2ce03aefab9060e1a42bd1aa1c571f6', userType: 'guest', uid: 1001 }, // w3lcome
  ],
};

// ============================================================================
// DARKNET (203.0.113.42)
// ============================================================================

const darknetConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: '63d7f708b7feb9c0494c64dbfb087f83', userType: 'root', uid: 0 }, // d4rkn3tR00t
    { username: 'ghost', passwordHash: 'd2aef0b37551aecfb067036d57f14930', userType: 'user', uid: 1000 }, // sp3ctr3
    { username: 'guest', passwordHash: 'e5ec4133db0a2e088310e8ecb0ee51d7', userType: 'guest', uid: 1001 }, // sh4d0w
  ],
};

// ============================================================================
// EXPORTS
// ============================================================================

export type MachineId = 'localhost' | '192.168.1.1' | '192.168.1.50' | '192.168.1.75' | '203.0.113.42';

export const machineFileSystems: Readonly<Record<MachineId, FileNode>> = {
  'localhost': createFileSystem(localhostConfig),
  '192.168.1.1': createFileSystem(gatewayConfig),
  '192.168.1.50': createFileSystem(fileserverConfig),
  '192.168.1.75': createFileSystem(webserverConfig),
  '203.0.113.42': createFileSystem(darknetConfig),
};

export const getDefaultHomePath = (_machineId: string, username: string): string => {
  if (username === 'root') return '/root';
  return `/home/${username}`;
};
