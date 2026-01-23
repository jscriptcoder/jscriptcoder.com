import { useCallback, useRef } from 'react';

export const useAutoComplete = (commandNames: string[]) => {
  const matchIndexRef = useRef(0);
  const lastInputRef = useRef('');

  const complete = useCallback((input: string): string => {
    const trimmed = input.trim();

    if (!trimmed) return input;

    // Find matches that start with the input
    const matches = commandNames.filter((name) =>
      name.toLowerCase().startsWith(trimmed.toLowerCase())
    );

    if (matches.length === 0) return input;

    // If input changed, reset the match index
    if (trimmed !== lastInputRef.current) {
      matchIndexRef.current = 0;
      lastInputRef.current = trimmed;
    } else {
      // Cycle through matches on repeated tab presses
      matchIndexRef.current = (matchIndexRef.current + 1) % matches.length;
    }

    // Return the matched command with parentheses
    return matches[matchIndexRef.current] + '()';
  }, [commandNames]);

  const resetCompletion = useCallback(() => {
    matchIndexRef.current = 0;
    lastInputRef.current = '';
  }, []);

  return {
    complete,
    resetCompletion,
  };
};
