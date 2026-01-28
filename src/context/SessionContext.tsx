import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type UserType = 'root' | 'user' | 'guest';

export interface Session {
  username: string;
  userType: UserType;
  machine: string;
}

interface SessionContextValue {
  session: Session;
  setUsername: (username: string, userType?: UserType) => void;
  setMachine: (machine: string) => void;
  getPrompt: () => string;
}

const defaultSession: Session = {
  username: 'jshacker',
  userType: 'user',
  machine: 'localhost',
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session>(defaultSession);

  const setUsername = useCallback((username: string, userType: UserType = 'user') => {
    setSession((prev) => ({ ...prev, username, userType }));
  }, []);

  const setMachine = useCallback((machine: string) => {
    setSession((prev) => ({ ...prev, machine }));
  }, []);

  const getPrompt = useCallback(() => {
    return `${session.username}@${session.machine}>`;
  }, [session.username, session.machine]);

  return (
    <SessionContext.Provider value={{ session, setUsername, setMachine, getPrompt }}>
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
