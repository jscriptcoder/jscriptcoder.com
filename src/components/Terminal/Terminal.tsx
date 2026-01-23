import { useState, useRef, useEffect, useCallback } from 'react';
import { TerminalOutput } from './TerminalOutput';
import { TerminalInput } from './TerminalInput';
import { useCommandHistory } from '../../hooks/useCommandHistory';
import { useAutoComplete } from '../../hooks/useAutoComplete';
import { createExecutionContext, getCommandNames } from '../../commands';
import type { OutputLine } from './types';

const BANNER = `
     ██╗███████╗ ██████╗██████╗ ██╗██████╗ ████████╗ ██████╗ ██████╗ ██████╗ ███████╗██████╗
     ██║██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗
     ██║███████╗██║     ██████╔╝██║██████╔╝   ██║   ██║     ██║   ██║██║  ██║█████╗  ██████╔╝
██   ██║╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   ██║     ██║   ██║██║  ██║██╔══╝  ██╔══██╗
╚█████╔╝███████║╚██████╗██║  ██║██║██║        ██║   ╚██████╗╚██████╔╝██████╔╝███████╗██║  ██║
 ╚════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝    ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
                                                                                   v0.1.0

  Type help() for available commands
`;

const getInitialLines = (): OutputLine[] => [
  { id: 0, type: 'banner' as OutputLine['type'], content: BANNER },
];

export const Terminal = () => {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<OutputLine[]>(getInitialLines);
  const lineIdRef = useRef(1);
  const outputRef = useRef<HTMLDivElement>(null);

  const { addCommand, navigateUp, navigateDown, resetNavigation } = useCommandHistory();
  const { complete, resetCompletion } = useAutoComplete(getCommandNames());

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = useCallback((type: OutputLine['type'], content: string) => {
    setLines((prev) => [
      ...prev,
      { id: lineIdRef.current++, type, content },
    ]);
  }, []);

  const executeCommand = useCallback((command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to output
    addLine('command', trimmedCommand);

    // Add to history
    addCommand(trimmedCommand);

    try {
      // Create execution context with all registered commands
      const context = createExecutionContext();

      // Build function with context variables
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);

      // Create a function that has access to all commands
      const fn = new Function(...contextKeys, `return ${trimmedCommand}`);

      // Execute and get result
      const result = fn(...contextValues);

      // Display result if not undefined
      if (result !== undefined) {
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        addLine('result', resultStr);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLine('error', `Error: ${errorMessage}`);
    }
  }, [addCommand, addLine]);

  const handleSubmit = useCallback(() => {
    executeCommand(input);
    setInput('');
    resetNavigation();
    resetCompletion();
  }, [input, executeCommand, resetNavigation, resetCompletion]);

  const handleHistoryUp = useCallback(() => {
    const cmd = navigateUp();
    if (cmd) setInput(cmd);
  }, [navigateUp]);

  const handleHistoryDown = useCallback(() => {
    const cmd = navigateDown();
    setInput(cmd);
  }, [navigateDown]);

  const handleTab = useCallback(() => {
    const completed = complete(input);
    setInput(completed);
  }, [input, complete]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    resetCompletion();
  }, [resetCompletion]);

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
      />
    </div>
  );
};
