import type { PersistedState } from '../session/SessionContext';
import type { FileSystemPatch } from '../filesystem/types';
import { isValidPersistedState } from '../session/SessionContext';
import { isValidPatch } from '../filesystem/FileSystemContext';
import {
  openDatabase,
  loadSessionState,
  saveSessionState,
  loadFilesystemPatches,
  saveFilesystemPatches,
} from './storage';

const LS_SESSION_KEY = 'jshack-session';
const LS_FILESYSTEM_KEY = 'jshack-filesystem';

type StorageCache = {
  readonly sessionState: PersistedState | null;
  readonly filesystemPatches: readonly FileSystemPatch[];
  readonly db: IDBDatabase | null;
};

// Module-level cache — written once before React mounts, read-only thereafter
let cache: StorageCache = {
  sessionState: null,
  filesystemPatches: [],
  db: null,
};

const loadSessionFromLocalStorage = (): PersistedState | null => {
  try {
    const stored = localStorage.getItem(LS_SESSION_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!isValidPersistedState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const loadPatchesFromLocalStorage = (): readonly FileSystemPatch[] => {
  try {
    const stored = localStorage.getItem(LS_FILESYSTEM_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isValidPatch)) return [];
    return parsed as readonly FileSystemPatch[];
  } catch {
    return [];
  }
};

export const initializeStorage = async (): Promise<void> => {
  try {
    const db = await openDatabase();

    let sessionState = await loadSessionState(db);
    let filesystemPatches = await loadFilesystemPatches(db);

    // Migrate from localStorage if IndexedDB is empty
    if (!sessionState) {
      const fromLS = loadSessionFromLocalStorage();
      if (fromLS) {
        await saveSessionState(db, fromLS);
        sessionState = fromLS;
        localStorage.removeItem(LS_SESSION_KEY);
      }
    }

    if (!filesystemPatches) {
      const fromLS = loadPatchesFromLocalStorage();
      if (fromLS.length > 0) {
        await saveFilesystemPatches(db, fromLS);
        filesystemPatches = fromLS;
        localStorage.removeItem(LS_FILESYSTEM_KEY);
      }
    }

    cache = {
      sessionState,
      filesystemPatches: filesystemPatches ?? [],
      db,
    };
  } catch {
    // IndexedDB unavailable — fall back to localStorage for initial load
    cache = {
      sessionState: loadSessionFromLocalStorage(),
      filesystemPatches: loadPatchesFromLocalStorage(),
      db: null,
    };
  }
};

export const getCachedSessionState = (): PersistedState | null => cache.sessionState;

export const getCachedFilesystemPatches = (): readonly FileSystemPatch[] => cache.filesystemPatches;

export const getDatabase = (): IDBDatabase | null => cache.db;

// Exposed for testing only
export const resetCache = (): void => {
  if (cache.db) {
    cache.db.close();
  }
  cache = { sessionState: null, filesystemPatches: [], db: null };
};
