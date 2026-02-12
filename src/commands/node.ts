import type { Command } from '../components/Terminal/types';
import type { UserType } from '../session/SessionContext';
import type { FileNode } from '../filesystem/types';

type NodeContext = {
  readonly resolvePath: (path: string) => string;
  readonly getNode: (path: string) => FileNode | null;
  readonly getUserType: () => UserType;
  readonly getExecutionContext: () => Record<string, (...args: unknown[]) => unknown>;
};

export const createNodeCommand = (context: NodeContext): Command => ({
  name: 'node',
  description: 'Execute a JavaScript file',
  manual: {
    synopsis: 'node(path: string)',
    description:
      'Execute the contents of a JavaScript file. ' +
      'The file runs with access to all terminal commands. ' +
      'Returns the result of the last expression, or undefined for statement-only code.',
    arguments: [
      {
        name: 'path',
        description: 'Path to the JavaScript file to execute',
        required: true,
      },
    ],
    examples: [
      { command: 'node("script.js")', description: 'Execute a JavaScript file' },
      { command: 'node("/home/user/exploit.js")', description: 'Run a script from absolute path' },
    ],
  },
  fn: (...args: unknown[]): unknown => {
    const path = args[0] as string | undefined;
    if (!path) {
      throw new Error('node: missing file operand');
    }

    const { resolvePath, getNode, getUserType, getExecutionContext } = context;
    const userType = getUserType();
    const targetPath = resolvePath(path);
    const node = getNode(targetPath);

    if (!node) {
      throw new Error(`node: ${path}: No such file or directory`);
    }

    if (node.type === 'directory') {
      throw new Error(`node: ${path}: Is a directory`);
    }

    if (!node.permissions.read.includes(userType)) {
      throw new Error(`node: ${path}: Permission denied`);
    }

    const content = node.content ?? '';
    if (!content.trim()) {
      return undefined;
    }

    const executionContext = getExecutionContext();
    const contextKeys = Object.keys(executionContext);
    const contextValues = Object.values(executionContext);

    // Try as expression first (single-expression files), fall back to statements
    try {
      const fn = new Function(...contextKeys, `return (${content})`);
      return fn(...contextValues);
    } catch {
      const fn = new Function(...contextKeys, content);
      return fn(...contextValues);
    }
  },
});
