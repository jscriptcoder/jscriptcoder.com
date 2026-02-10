import type { PersistedState } from '../session/SessionContext';
import type { FileSystemPatch } from '../filesystem/types';
import { isValidPersistedState } from '../session/SessionContext';
import { isValidPatch } from '../filesystem/FileSystemContext';

const DB_NAME = 'jshack-db';
const DB_VERSION = 1;
const SESSION_STORE = 'session';
const FILESYSTEM_STORE = 'filesystem';
const SESSION_KEY = 'state';
const FILESYSTEM_KEY = 'patches';

export const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE);
      }
      if (!db.objectStoreNames.contains(FILESYSTEM_STORE)) {
        db.createObjectStore(FILESYSTEM_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getValue = <T>(
  db: IDBDatabase,
  storeName: string,
  key: string
): Promise<T | null> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve((request.result ?? null) as T | null);
    request.onerror = () => reject(request.error);
  });

const setValue = <T>(
  db: IDBDatabase,
  storeName: string,
  key: string,
  value: T
): Promise<void> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

export const loadSessionState = async (
  db: IDBDatabase
): Promise<PersistedState | null> => {
  try {
    const data = await getValue<unknown>(db, SESSION_STORE, SESSION_KEY);
    if (!data || !isValidPersistedState(data)) return null;
    return data;
  } catch {
    return null;
  }
};

export const saveSessionState = async (
  db: IDBDatabase,
  state: PersistedState
): Promise<void> => {
  try {
    await setValue(db, SESSION_STORE, SESSION_KEY, state);
  } catch {
    // Ignore write errors
  }
};

export const loadFilesystemPatches = async (
  db: IDBDatabase
): Promise<readonly FileSystemPatch[] | null> => {
  try {
    const data = await getValue<unknown>(db, FILESYSTEM_STORE, FILESYSTEM_KEY);
    if (!data) return null;
    if (!Array.isArray(data) || !data.every(isValidPatch)) return null;
    return data as readonly FileSystemPatch[];
  } catch {
    return null;
  }
};

export const saveFilesystemPatches = async (
  db: IDBDatabase,
  patches: readonly FileSystemPatch[]
): Promise<void> => {
  try {
    await setValue(db, FILESYSTEM_STORE, FILESYSTEM_KEY, [...patches]);
  } catch {
    // Ignore write errors
  }
};
