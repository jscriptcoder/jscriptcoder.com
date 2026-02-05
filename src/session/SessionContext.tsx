import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type UserType = 'root' | 'user' | 'guest';

export type Session = {
  readonly username: string;
  readonly userType: UserType;
  readonly machine: string;
  readonly currentPath: string;
};

export type SessionSnapshot = {
  readonly username: string;
  readonly userType: UserType;
  readonly machine: string;
  readonly currentPath: string;
};

export type FtpSession = {
  readonly remoteMachine: string;
  readonly remoteUsername: string;
  readonly remoteUserType: UserType;
  readonly remoteCwd: string;
  readonly originMachine: string;
  readonly originUsername: string;
  readonly originUserType: UserType;
  readonly originCwd: string;
};

export type NcSession = {
  readonly targetIP: string;
  readonly targetPort: number;
  readonly service: string;
};

// --- Persistence ---

const STORAGE_KEY = 'jshack-session';

type PersistedState = {
  readonly session: Session;
  readonly sessionStack: readonly SessionSnapshot[];
  readonly ftpSession: FtpSession | null;
  readonly ncSession: NcSession | null;
};

const isValidUserType = (value: unknown): value is UserType =>
  value === 'root' || value === 'user' || value === 'guest';

const isValidSession = (value: unknown): value is Session =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Session).username === 'string' &&
  typeof (value as Session).machine === 'string' &&
  typeof (value as Session).currentPath === 'string' &&
  isValidUserType((value as Session).userType);

const isValidSessionSnapshot = (value: unknown): value is SessionSnapshot =>
  isValidSession(value);

const isValidFtpSession = (value: unknown): value is FtpSession =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as FtpSession).remoteMachine === 'string' &&
  typeof (value as FtpSession).remoteUsername === 'string' &&
  typeof (value as FtpSession).remoteCwd === 'string' &&
  typeof (value as FtpSession).originMachine === 'string' &&
  typeof (value as FtpSession).originUsername === 'string' &&
  typeof (value as FtpSession).originCwd === 'string' &&
  isValidUserType((value as FtpSession).remoteUserType) &&
  isValidUserType((value as FtpSession).originUserType);

const isValidNcSession = (value: unknown): value is NcSession =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as NcSession).targetIP === 'string' &&
  typeof (value as NcSession).targetPort === 'number' &&
  typeof (value as NcSession).service === 'string';

const isValidPersistedState = (value: unknown): value is PersistedState =>
  typeof value === 'object' &&
  value !== null &&
  isValidSession((value as PersistedState).session) &&
  Array.isArray((value as PersistedState).sessionStack) &&
  (value as PersistedState).sessionStack.every(isValidSessionSnapshot) &&
  ((value as PersistedState).ftpSession === null ||
    isValidFtpSession((value as PersistedState).ftpSession)) &&
  ((value as PersistedState).ncSession === null ||
    (value as PersistedState).ncSession === undefined ||
    isValidNcSession((value as PersistedState).ncSession));

const loadPersistedState = (): PersistedState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    if (!isValidPersistedState(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
};

const savePersistedState = (state: PersistedState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
};

type SessionContextValue = {
  readonly session: Session;
  readonly sessionStack: readonly SessionSnapshot[];
  readonly ftpSession: FtpSession | null;
  readonly ncSession: NcSession | null;
  readonly setUsername: (username: string, userType?: UserType) => void;
  readonly setMachine: (machine: string) => void;
  readonly setCurrentPath: (path: string) => void;
  readonly getPrompt: () => string;
  readonly pushSession: () => void;
  readonly popSession: () => SessionSnapshot | null;
  readonly canReturn: () => boolean;
  // FTP session methods
  readonly enterFtpMode: (ftpSession: FtpSession) => void;
  readonly exitFtpMode: () => FtpSession | null;
  readonly updateFtpRemoteCwd: (cwd: string) => void;
  readonly updateFtpOriginCwd: (cwd: string) => void;
  readonly isInFtpMode: () => boolean;
  // NC session methods
  readonly enterNcMode: (ncSession: NcSession) => void;
  readonly exitNcMode: () => NcSession | null;
  readonly isInNcMode: () => boolean;
};

const defaultSession: Session = {
  username: 'jshacker',
  userType: 'user',
  machine: 'localhost',
  currentPath: '/home/jshacker',
};

const SessionContext = createContext<SessionContextValue | null>(null);

const getInitialState = (): PersistedState => {
  const persisted = loadPersistedState();
  if (persisted) return { ...persisted, ncSession: persisted.ncSession ?? null };
  return {
    session: defaultSession,
    sessionStack: [],
    ftpSession: null,
    ncSession: null,
  };
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [initialState] = useState(getInitialState);
  const [session, setSession] = useState<Session>(initialState.session);
  const [sessionStack, setSessionStack] = useState<readonly SessionSnapshot[]>(initialState.sessionStack);
  const [ftpSession, setFtpSession] = useState<FtpSession | null>(initialState.ftpSession);
  const [ncSession, setNcSession] = useState<NcSession | null>(initialState.ncSession);

  // Persist state changes to localStorage
  useEffect(() => {
    savePersistedState({ session, sessionStack, ftpSession, ncSession });
  }, [session, sessionStack, ftpSession, ncSession]);

  const setUsername = useCallback((username: string, userType: UserType = 'user') => {
    setSession((prev) => ({ ...prev, username, userType }));
  }, []);

  const setMachine = useCallback((machine: string) => {
    setSession((prev) => ({ ...prev, machine }));
  }, []);

  const setCurrentPath = useCallback((currentPath: string) => {
    setSession((prev) => ({ ...prev, currentPath }));
  }, []);

  const getPrompt = useCallback(() => {
    if (ftpSession) return 'ftp>';
    if (ncSession) return '$';
    return `${session.username}@${session.machine}>`;
  }, [session.username, session.machine, ftpSession, ncSession]);

  const pushSession = useCallback(() => {
    const snapshot: SessionSnapshot = {
      username: session.username,
      userType: session.userType,
      machine: session.machine,
      currentPath: session.currentPath,
    };
    setSessionStack((prev) => [...prev, snapshot]);
  }, [session.username, session.userType, session.machine, session.currentPath]);

  const popSession = useCallback((): SessionSnapshot | null => {
    if (sessionStack.length === 0) return null;

    const snapshot = sessionStack[sessionStack.length - 1];
    setSessionStack((prev) => prev.slice(0, -1));
    setSession({
      username: snapshot.username,
      userType: snapshot.userType,
      machine: snapshot.machine,
      currentPath: snapshot.currentPath,
    });
    return snapshot;
  }, [sessionStack]);

  const canReturn = useCallback(() => sessionStack.length > 0, [sessionStack.length]);

  const enterFtpMode = useCallback((newFtpSession: FtpSession) => {
    setFtpSession(newFtpSession);
  }, []);

  const exitFtpMode = useCallback((): FtpSession | null => {
    const current = ftpSession;
    setFtpSession(null);
    return current;
  }, [ftpSession]);

  const updateFtpRemoteCwd = useCallback((cwd: string) => {
    setFtpSession((prev) => prev ? { ...prev, remoteCwd: cwd } : null);
  }, []);

  const updateFtpOriginCwd = useCallback((cwd: string) => {
    setFtpSession((prev) => prev ? { ...prev, originCwd: cwd } : null);
  }, []);

  const isInFtpMode = useCallback(() => ftpSession !== null, [ftpSession]);

  const enterNcMode = useCallback((newNcSession: NcSession) => {
    setNcSession(newNcSession);
  }, []);

  const exitNcMode = useCallback((): NcSession | null => {
    const current = ncSession;
    setNcSession(null);
    return current;
  }, [ncSession]);

  const isInNcMode = useCallback(() => ncSession !== null, [ncSession]);

  return (
    <SessionContext.Provider
      value={{
        session,
        sessionStack,
        ftpSession,
        ncSession,
        setUsername,
        setMachine,
        setCurrentPath,
        getPrompt,
        pushSession,
        popSession,
        canReturn,
        enterFtpMode,
        exitFtpMode,
        updateFtpRemoteCwd,
        updateFtpOriginCwd,
        isInFtpMode,
        enterNcMode,
        exitNcMode,
        isInNcMode,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
