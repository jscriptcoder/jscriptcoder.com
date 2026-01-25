import { useState, useRef, useEffect, useCallback } from 'react';
import { TerminalOutput } from './TerminalOutput';
import { TerminalInput } from './TerminalInput';
import { useCommandHistory } from '../../hooks/useCommandHistory';
import { useAutoComplete } from '../../hooks/useAutoComplete';
import { useVariables } from '../../hooks/useVariables';
import { useCommands } from '../../hooks/useCommands';
import { useSession } from '../../context/SessionContext';
import type { OutputLine, AuthorData } from './types';

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
  const { getVariables, getVariableNames, handleVariableOperation } = useVariables();
  const { getPrompt } = useSession();
  const { executionContext, commandNames } = useCommands();

  const { getCompletions } = useAutoComplete(commandNames, getVariableNames());

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
      // Combine commands and variables into execution context
      const variables = getVariables();
      const context = { ...executionContext, ...variables };

      // Build function with context variables
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);

      // Create a function that has access to all commands and variables
      const fn = new Function(...contextKeys, `return ${trimmedCommand}`);

      // Execute and get result
      const result = fn(...contextValues);

      // Display result if not undefined
      if (result !== undefined) {
        // Check for special result types
        if (result && typeof result === 'object' && '__type' in result) {
          if (result.__type === 'clear') {
            clearLines();
            return;
          }
          if (result.__type === 'author') {
            addLine('author', result as AuthorData);
            return;
          }
        }
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        addLine('result', resultStr);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLine('error', `Error: ${errorMessage}`);
    }
  }, [addCommand, addLine, clearLines, handleVariableOperation, getVariables, getPrompt, executionContext]);

  const handleSubmit = useCallback(() => {
    executeCommand(input);
    setInput('');
    resetNavigation();
  }, [input, executeCommand, resetNavigation]);

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
      />
    </div>
  );
};
