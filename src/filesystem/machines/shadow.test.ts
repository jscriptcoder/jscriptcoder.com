import { describe, it, expect } from 'vitest';
import { shadow } from './shadow';
import type { FileNode } from '../types';

const getNode = (root: FileNode, path: readonly string[]): FileNode | undefined =>
  path.reduce<FileNode | undefined>((node, segment) => node?.children?.[segment], root);

const getContent = (path: readonly string[]): string => getNode(shadow, path)?.content ?? '';

const accessLog = getContent(['home', 'operator', 'diagnostics', 'access.log']);
const scriptSource = getContent(['home', 'operator', 'diagnostics', 'check_logs.js']);

const runScript = (source: string): { readonly output: string; readonly error: unknown } => {
  let output = '';
  const cat = (path: string): string => {
    if (path === 'diagnostics/access.log') return accessLog;
    return '';
  };
  const echo = (value: string): void => {
    output = value;
  };

  try {
    new Function('cat', 'echo', source)(cat, echo);
    return { output, error: null };
  } catch (e) {
    return { output, error: e };
  }
};

describe('Flag 14 — Shadow Debugger (check_logs.js)', () => {
  describe('buggy script behavior', () => {
    it('throws TypeError due to off-by-one (i <= lines.length accesses undefined)', () => {
      const { error } = runScript(scriptSource);
      expect(error).toBeInstanceOf(TypeError);
    });

    it('produces empty tags when only off-by-one is fixed (wrong delimiter)', () => {
      const fixedBoundary = scriptSource.replace('<= lines.length', '< lines.length');
      const { output, error } = runScript(fixedBoundary);
      expect(error).toBeNull();
      expect(output).toBe('Security tags: ');
    });
  });

  describe('fixed script extracts flag', () => {
    it('produces FLAG{shadow_debugger} when both bugs are fixed', () => {
      const fixed = scriptSource
        .replace('<= lines.length', '< lines.length')
        .replace('split(",")', 'split("|")');
      const { output, error } = runScript(fixed);
      expect(error).toBeNull();
      expect(output).toBe('Security tags: FLAG{shadow_debugger}');
    });
  });

  describe('access.log format', () => {
    it('every data line is pipe-delimited with exactly 5 fields', () => {
      const lines = accessLog.split('\n').filter((l: string) => l.length > 0);
      expect(lines.length).toBeGreaterThan(0);
      lines.forEach((line: string) => {
        expect(line.split('|')).toHaveLength(5);
      });
    });

    it('tag field (index 3) of each line is a single character', () => {
      const lines = accessLog.split('\n').filter((l: string) => l.length > 0);
      lines.forEach((line: string) => {
        expect(line.split('|')[3]).toHaveLength(1);
      });
    });
  });
});
