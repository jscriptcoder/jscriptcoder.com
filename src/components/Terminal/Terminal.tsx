import { useState, useRef, useEffect, useCallback } from 'react';
import { TerminalOutput } from './TerminalOutput';
import { TerminalInput } from './TerminalInput';
import { useCommandHistory } from '../../hooks/useCommandHistory';
import { useAutoComplete } from '../../hooks/useAutoComplete';
import { useVariables } from '../../hooks/useVariables';
import { useCommands } from '../../hooks/useCommands';
import { useFtpCommands } from '../../hooks/useFtpCommands';
import { useSession } from '../../context/SessionContext';
import type { FtpSession } from '../../context/SessionContext';
import { useFileSystem } from '../../filesystem/FileSystemContext';
import { useNetwork } from '../../network';
import { md5 } from '../../utils/md5';
import type { OutputLine, AuthorData } from './types';
import { isAuthorData, isPasswordPrompt, isClearOutput, isExitOutput, isAsyncOutput, isSshPrompt, isFtpPrompt, isFtpQuit } from './types';
import type { AsyncFollowUp } from './types';
import type { UserType } from '../../context/SessionContext';

const BANNER = `
     ██╗███████╗██╗  ██╗ █████╗  ██████╗██╗  ██╗   ███╗   ███╗███████╗
     ██║██╔════╝██║  ██║██╔══██╗██╔════╝██║ ██╔╝   ████╗ ████║██╔════╝
     ██║███████╗███████║███████║██║     █████╔╝    ██╔████╔██║█████╗
██   ██║╚════██║██╔══██║██╔══██║██║     ██╔═██╗    ██║╚██╔╝██║██╔══╝
╚█████╔╝███████║██║  ██║██║  ██║╚██████╗██║  ██╗██╗██║ ╚═╝ ██║███████╗
 ╚════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝
                                                              v0.1.0

  Type help() for available commands
`;

const getInitialLines = (): OutputLine[] => [
  { id: 0, type: 'banner' as OutputLine['type'], content: BANNER },
];

export const Terminal = () => {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<OutputLine[]>(getInitialLines);
  const [passwordMode, setPasswordMode] = useState(false);
  const [targetUser, setTargetUser] = useState<string | null>(null);
  const [sshTargetIP, setSshTargetIP] = useState<string | null>(null);
  const [ftpTargetIP, setFtpTargetIP] = useState<string | null>(null);
  const [ftpUsernameMode, setFtpUsernameMode] = useState(false);
  const [asyncRunning, setAsyncRunning] = useState(false);
  const lineIdRef = useRef(1);
  const outputRef = useRef<HTMLDivElement>(null);
  const asyncCancelRef = useRef<(() => void) | null>(null);

  const { addCommand, navigateUp, navigateDown, resetNavigation } = useCommandHistory();
  const { getVariables, getVariableNames, handleVariableOperation } = useVariables();
  const { getPrompt, setUsername, setMachine, pushSession, popSession, canReturn, session, enterFtpMode, exitFtpMode, isInFtpMode } = useSession();
  const { executionContext, commandNames } = useCommands();
  const ftpCommands = useFtpCommands();
  const { readFile, setCurrentPath, switchMachine, currentPath, currentMachine } = useFileSystem();
  const { getMachine } = useNetwork();

  // Use FTP commands for autocomplete when in FTP mode
  const activeCommandNames = isInFtpMode() && ftpCommands
    ? Array.from(ftpCommands.keys())
    : commandNames;
  const { getCompletions } = useAutoComplete(activeCommandNames, getVariableNames());

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = useCallback((type: OutputLine['type'], content: string | AuthorData, prompt?: string) => {
    setLines((prev) => [
      ...prev,
      { id: lineIdRef.current++, type, content, prompt },
    ]);
  }, []);

  const clearLines = useCallback(() => {
    setLines([]);
  }, []);

  const executeCommand = useCallback((command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to output with current prompt
    addLine('command', trimmedCommand, getPrompt());

    // Add to history
    addCommand(trimmedCommand);

    try {
      // Check if this is a variable operation (declaration or assignment)
      const variableResult = handleVariableOperation(trimmedCommand, executionContext);

      if (variableResult !== null) {
        // This was a variable operation
        if (!variableResult.success) {
          addLine('error', `Error: ${variableResult.error}`);
        } else if (variableResult.value !== undefined) {
          const resultStr = typeof variableResult.value === 'string'
            ? variableResult.value
            : JSON.stringify(variableResult.value, null, 2);
          addLine('result', resultStr);
        }
        return;
      }

      // Not a variable operation, execute as normal command
      // Use FTP commands when in FTP mode, otherwise use normal commands
      const activeContext = isInFtpMode() && ftpCommands
        ? Object.fromEntries(Array.from(ftpCommands.entries()).map(([k, v]) => [k, v.fn]))
        : executionContext;

      // Combine commands and variables into execution context
      const variables = getVariables();
      const context = { ...activeContext, ...variables };

      // Build function with context variables
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);

      // Create a function that has access to all commands and variables
      const fn = new Function(...contextKeys, `return ${trimmedCommand}`);

      // Execute and get result
      const result = fn(...contextValues);

      // Display result if not undefined
      if (result !== undefined) {
        // Check for special result types using type guards
        if (isClearOutput(result)) {
          clearLines();
          return;
        }
        if (isExitOutput(result)) {
          if (!canReturn()) {
            addLine('error', 'exit: not connected to a remote machine');
            return;
          }
          const snapshot = popSession();
          if (snapshot) {
            switchMachine(snapshot.machine as Parameters<typeof switchMachine>[0], snapshot.username);
            setCurrentPath(snapshot.currentPath);
            addLine('result', 'Connection closed.');
          }
          return;
        }
        if (isFtpQuit(result)) {
          const ftpSession = exitFtpMode();
          if (ftpSession) {
            addLine('result', '221 Goodbye.');
          }
          return;
        }
        if (isAuthorData(result)) {
          addLine('author', result);
          return;
        }
        if (isPasswordPrompt(result)) {
          setTargetUser(result.targetUser);
          setPasswordMode(true);
          addLine('result', 'Password:');
          return;
        }
        if (isAsyncOutput(result)) {
          setAsyncRunning(true);
          asyncCancelRef.current = result.cancel ?? null;

          result.start(
            // onLine callback
            (line: string) => {
              addLine('result', line);
            },
            // onComplete callback with optional follow-up
            (followUp?: AsyncFollowUp) => {
              setAsyncRunning(false);
              asyncCancelRef.current = null;

              // Handle SSH prompt follow-up
              if (isSshPrompt(followUp)) {
                setTargetUser(followUp.targetUser);
                setSshTargetIP(followUp.targetIP);
                setPasswordMode(true);
                addLine('result', `${followUp.targetUser}@${followUp.targetIP}'s password:`);
              }

              // Handle FTP prompt follow-up
              if (isFtpPrompt(followUp)) {
                setFtpTargetIP(followUp.targetIP);
                setFtpUsernameMode(true);
                addLine('result', `Name (${followUp.targetIP}:anonymous):`);
              }
            }
          );
          return;
        }
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        addLine('result', resultStr);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLine('error', `Error: ${errorMessage}`);
    }
  }, [addCommand, addLine, clearLines, handleVariableOperation, getVariables, getPrompt, executionContext, canReturn, popSession, switchMachine, setCurrentPath, isInFtpMode, ftpCommands, exitFtpMode]);

  const validatePassword = useCallback((password: string): boolean => {
    if (!targetUser) return false;

    // SSH mode: validate against remote machine's users
    if (sshTargetIP) {
      const machine = getMachine(sshTargetIP);
      if (!machine) return false;

      const remoteUser = machine.users.find(u => u.username === targetUser);
      if (!remoteUser) return false;

      const inputHash = md5(password);
      return remoteUser.passwordHash === inputHash;
    }

    // FTP mode: validate against remote machine's users
    if (ftpTargetIP) {
      const machine = getMachine(ftpTargetIP);
      if (!machine) return false;

      const remoteUser = machine.users.find(u => u.username === targetUser);
      if (!remoteUser) return false;

      const inputHash = md5(password);
      return remoteUser.passwordHash === inputHash;
    }

    // Local su mode: Read passwd file as root to get hashes
    const passwdContent = readFile('/etc/passwd', 'root');
    if (!passwdContent) return false;

    // Parse passwd file to find user's hash
    const lines = passwdContent.split('\n');
    for (const line of lines) {
      const parts = line.split(':');
      if (parts[0] === targetUser && parts[1]) {
        const storedHash = parts[1];
        const inputHash = md5(password);
        return storedHash === inputHash;
      }
    }
    return false;
  }, [targetUser, sshTargetIP, ftpTargetIP, readFile, getMachine]);

  const handleFtpUsernameSubmit = useCallback(() => {
    if (!ftpTargetIP) return;

    const username = input.trim() || 'anonymous';
    addLine('command', username, `Name (${ftpTargetIP}:anonymous):`);

    // Check if user exists on remote machine
    const machine = getMachine(ftpTargetIP);
    if (!machine) {
      addLine('error', '530 Login incorrect.');
      setFtpTargetIP(null);
      setFtpUsernameMode(false);
      setInput('');
      return;
    }

    const remoteUser = machine.users.find(u => u.username === username);
    if (!remoteUser) {
      addLine('error', '530 Login incorrect.');
      setFtpTargetIP(null);
      setFtpUsernameMode(false);
      setInput('');
      return;
    }

    // Username valid, prompt for password
    addLine('result', '331 Please specify the password.');
    setTargetUser(username);
    setFtpUsernameMode(false);
    setPasswordMode(true);
    setInput('');
  }, [input, ftpTargetIP, getMachine, addLine]);

  const handlePasswordSubmit = useCallback(() => {
    // Show masked password in output
    const maskedPassword = '*'.repeat(input.length);
    const promptLabel = ftpTargetIP
      ? 'Password:'
      : sshTargetIP
        ? `${targetUser}@${sshTargetIP}'s password:`
        : 'Password:';
    addLine('command', maskedPassword, promptLabel);

    if (validatePassword(input)) {
      if (ftpTargetIP) {
        // FTP mode: enter FTP session
        const machine = getMachine(ftpTargetIP);
        const remoteUser = machine?.users.find(u => u.username === targetUser);
        const userType: UserType = remoteUser?.userType ?? 'user';
        const remoteHomePath = targetUser === 'root' ? '/root' : `/home/${targetUser}`;

        const newFtpSession: FtpSession = {
          remoteMachine: ftpTargetIP,
          remoteUsername: targetUser!,
          remoteUserType: userType,
          remoteCwd: remoteHomePath,
          originMachine: currentMachine,
          originUsername: session.username,
          originUserType: session.userType,
          originCwd: currentPath,
        };

        enterFtpMode(newFtpSession);
        addLine('result', '230 Login successful.');
      } else if (sshTargetIP) {
        // SSH mode: save current session and switch to remote machine
        pushSession(currentPath);

        const machine = getMachine(sshTargetIP);
        const remoteUser = machine?.users.find(u => u.username === targetUser);
        const userType: UserType = remoteUser?.userType ?? 'user';

        setUsername(targetUser!, userType);
        setMachine(sshTargetIP);
        // Switch filesystem to remote machine
        switchMachine(sshTargetIP as Parameters<typeof switchMachine>[0], targetUser!);
        addLine('result', `Connected to ${sshTargetIP}`);
        addLine('result', `Welcome to ${machine?.hostname ?? sshTargetIP}!`);
      } else {
        // Local su mode
        let userType: UserType = 'user';
        let homePath = `/home/${targetUser}`;

        if (targetUser === 'root') {
          userType = 'root';
          homePath = '/root';
        } else if (targetUser === 'guest') {
          userType = 'guest';
        }

        setUsername(targetUser!, userType);
        setCurrentPath(homePath);
        addLine('result', `Switched to user: ${targetUser}`);
      }
    } else {
      if (ftpTargetIP) {
        addLine('error', '530 Login incorrect.');
      } else if (sshTargetIP) {
        addLine('error', `Permission denied, please try again.`);
      } else {
        addLine('error', 'su: Authentication failure');
      }
    }

    // Exit password mode
    setPasswordMode(false);
    setTargetUser(null);
    setSshTargetIP(null);
    setFtpTargetIP(null);
    setInput('');
  }, [input, targetUser, sshTargetIP, ftpTargetIP, validatePassword, setUsername, setMachine, setCurrentPath, switchMachine, pushSession, currentPath, currentMachine, session, getMachine, enterFtpMode, addLine]);

  const handleSubmit = useCallback(() => {
    if (ftpUsernameMode) {
      handleFtpUsernameSubmit();
    } else if (passwordMode) {
      handlePasswordSubmit();
    } else {
      executeCommand(input);
      setInput('');
    }
    resetNavigation();
  }, [input, passwordMode, ftpUsernameMode, executeCommand, handlePasswordSubmit, handleFtpUsernameSubmit, resetNavigation]);

  const handleHistoryUp = useCallback(() => {
    const cmd = navigateUp();
    if (cmd) setInput(cmd);
  }, [navigateUp]);

  const handleHistoryDown = useCallback(() => {
    const cmd = navigateDown();
    setInput(cmd);
  }, [navigateDown]);

  const handleTab = useCallback(() => {
    const { matches, displayText } = getCompletions(input);
    if (matches.length === 1) {
      // Single match - autocomplete
      setInput(matches[0].display);
    } else if (matches.length > 1) {
      // Multiple matches - show list
      addLine('result', displayText);
    }
  }, [input, getCompletions, addLine]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  // Focus terminal on click
  const handleTerminalClick = useCallback(() => {
    // Input will be focused by TerminalInput's click handler
  }, []);

  return (
    <div
      className="flex flex-col h-screen bg-black font-mono text-sm"
      onClick={handleTerminalClick}
    >
      <div ref={outputRef} className="flex-1 overflow-y-auto">
        <TerminalOutput lines={lines} />
      </div>
      <TerminalInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onHistoryUp={handleHistoryUp}
        onHistoryDown={handleHistoryDown}
        onTab={handleTab}
        promptMode={passwordMode ? 'password' : ftpUsernameMode ? 'username' : undefined}
        disabled={asyncRunning}
      />
    </div>
  );
};
