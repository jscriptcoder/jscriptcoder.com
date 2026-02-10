import { useState, useCallback } from 'react';

type Variable = {
  readonly value: unknown;
  readonly isConst: boolean;
};

type VariableStore = {
  readonly [key: string]: Variable;
};

export type VariableResult = {
  readonly success: boolean;
  readonly value?: unknown;
  readonly error?: string;
};

// Regex patterns for variable declarations and assignments
const CONST_DECLARATION = /^const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/;
const LET_DECLARATION = /^let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/;
const REASSIGNMENT = /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/;

export const useVariables = () => {
  const [variables, setVariables] = useState<VariableStore>({});

  const getVariables = useCallback(
    (): Record<string, unknown> =>
      Object.fromEntries(
        Object.entries(variables).map(([name, variable]) => [name, variable.value]),
      ),
    [variables],
  );

  const getVariableNames = useCallback((): string[] => {
    return Object.keys(variables);
  }, [variables]);

  const parseExpression = useCallback(
    (expression: string, context: Record<string, unknown>): unknown => {
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);
      const fn = new Function(...contextKeys, `return ${expression}`);
      return fn(...contextValues);
    },
    [],
  );

  const handleVariableOperation = useCallback(
    (input: string, executionContext: Record<string, unknown>): VariableResult | null => {
      const trimmed = input.trim();

      // Check for const declaration
      const constMatch = trimmed.match(CONST_DECLARATION);
      if (constMatch) {
        const [, name, expression] = constMatch;

        // Check if variable already exists
        if (variables[name] !== undefined) {
          return {
            success: false,
            error: `Identifier '${name}' has already been declared`,
          };
        }

        try {
          // Create context that includes existing variables
          const fullContext = { ...executionContext, ...getVariables() };
          const value = parseExpression(expression, fullContext);

          setVariables((prev) => ({
            ...prev,
            [name]: { value, isConst: true },
          }));

          return { success: true, value };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }

      // Check for let declaration
      const letMatch = trimmed.match(LET_DECLARATION);
      if (letMatch) {
        const [, name, expression] = letMatch;

        // Check if variable already exists
        if (variables[name] !== undefined) {
          return {
            success: false,
            error: `Identifier '${name}' has already been declared`,
          };
        }

        try {
          const fullContext = { ...executionContext, ...getVariables() };
          const value = parseExpression(expression, fullContext);

          setVariables((prev) => ({
            ...prev,
            [name]: { value, isConst: false },
          }));

          return { success: true, value };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }

      // Check for reassignment (no const/let keyword)
      const reassignMatch = trimmed.match(REASSIGNMENT);
      if (reassignMatch) {
        const [, name, expression] = reassignMatch;

        // Check if variable exists
        if (variables[name] === undefined) {
          // Not a variable reassignment, let normal execution handle it
          return null;
        }

        // Check if it's a const
        if (variables[name].isConst) {
          return {
            success: false,
            error: `Assignment to constant variable '${name}'`,
          };
        }

        try {
          const fullContext = { ...executionContext, ...getVariables() };
          const value = parseExpression(expression, fullContext);

          setVariables((prev) => ({
            ...prev,
            [name]: { ...prev[name], value },
          }));

          return { success: true, value };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }

      // Not a variable operation
      return null;
    },
    [variables, getVariables, parseExpression],
  );

  return {
    variables,
    getVariables,
    getVariableNames,
    handleVariableOperation,
  };
};
