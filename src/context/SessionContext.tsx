import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type UserType = 'root' | 'user' | 'guest';

export type Session = {
  readonly username: string;
  readonly userType: UserType;
  readonly machine: string;
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

type SessionContextValue = {
  readonly session: Session;
  readonly sessionStack: readonly SessionSnapshot[];
  readonly ftpSession: FtpSession | null;
  readonly setUsername: (username: string, userType?: UserType) => void;
  readonly setMachine: (machine: string) => void;
  readonly getPrompt: () => string;
  readonly pushSession: (currentPath: string) => void;
  readonly popSession: () => SessionSnapshot | null;
  readonly canReturn: () => boolean;
  // FTP session methods
  readonly enterFtpMode: (ftpSession: FtpSession) => void;
  readonly exitFtpMode: () => FtpSession | null;
  readonly updateFtpRemoteCwd: (cwd: string) => void;
  readonly updateFtpOriginCwd: (cwd: string) => void;
  readonly isInFtpMode: () => boolean;
};

const defaultSession: Session = {
  username: 'jshacker',
  userType: 'user',
  machine: 'localhost',
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session>(defaultSession);
  const [sessionStack, setSessionStack] = useState<readonly SessionSnapshot[]>([]);
  const [ftpSession, setFtpSession] = useState<FtpSession | null>(null);

  const setUsername = useCallback((username: string, userType: UserType = 'user') => {
    setSession((prev) => ({ ...prev, username, userType }));
  }, []);

  const setMachine = useCallback((machine: string) => {
    setSession((prev) => ({ ...prev, machine }));
  }, []);

  const getPrompt = useCallback(() => {
    if (ftpSession) return 'ftp>';
    return `${session.username}@${session.machine}>`;
  }, [session.username, session.machine, ftpSession]);

  const pushSession = useCallback((currentPath: string) => {
    const snapshot: SessionSnapshot = {
      username: session.username,
      userType: session.userType,
      machine: session.machine,
      currentPath,
    };
    setSessionStack((prev) => [...prev, snapshot]);
  }, [session.username, session.userType, session.machine]);

  const popSession = useCallback((): SessionSnapshot | null => {
    if (sessionStack.length === 0) return null;

    const snapshot = sessionStack[sessionStack.length - 1];
    setSessionStack((prev) => prev.slice(0, -1));
    setSession({
      username: snapshot.username,
      userType: snapshot.userType,
      machine: snapshot.machine,
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

  return (
    <SessionContext.Provider
      value={{
        session,
        sessionStack,
        ftpSession,
        setUsername,
        setMachine,
        getPrompt,
        pushSession,
        popSession,
        canReturn,
        enterFtpMode,
        exitFtpMode,
        updateFtpRemoteCwd,
        updateFtpOriginCwd,
        isInFtpMode,
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
