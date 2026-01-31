import { useCallback } from 'react';

export type CompletionMatch = {
  readonly name: string;
  readonly display: string; // name with () for functions
};

export type CompletionResult = {
  readonly matches: readonly CompletionMatch[];
  readonly displayText: string; // comma-separated list
};

export const useAutoComplete = (
  commandNames: readonly string[],
  variableNames: readonly string[] = []
) => {
  const getCompletions = useCallback((input: string): CompletionResult => {
    const trimmed = input.trim();

    if (!trimmed) {
      return { matches: [], displayText: '' };
    }

    // Build completion items: commands get (), variables don't
    const commandItems = commandNames.map((name) => ({
      name,
      display: name + '()',
    }));
    const variableItems = variableNames.map((name) => ({
      name,
      display: name,
    }));

    const allItems = [...commandItems, ...variableItems];

    // Find matches that start with the input, sorted alphabetically
    const matches = allItems
      .filter((item) => item.name.toLowerCase().startsWith(trimmed.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    const displayText = matches.map((m) => m.display).join(', ');

    return { matches, displayText };
  }, [commandNames, variableNames]);

  return {
    getCompletions,
  };
};
