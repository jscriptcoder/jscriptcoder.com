import { describe, it, expect } from 'vitest';
import type { Command } from '../components/Terminal/types';
import { echoCommand } from './echo';
import { createHelpCommand } from './help';
import { createManCommand } from './man';

// --- Factory Functions ---

const getMockCommand = (overrides?: Partial<Command>): Command => ({
  name: 'test',
  description: 'A test command',
  fn: () => 'test result',
  ...overrides,
});

describe('echo command', () => {
  const echo = echoCommand.fn;

  describe('primitive values', () => {
    it('should return undefined as string', () => {
      expect(echo(undefined)).toBe('undefined');
    });

    it('should return undefined when called with no arguments', () => {
      expect(echo()).toBe('undefined');
    });

    it('should return null as string', () => {
      expect(echo(null)).toBe('null');
    });

    it('should return string as-is', () => {
      expect(echo('Hello World')).toBe('Hello World');
    });

    it('should return empty string as-is', () => {
      expect(echo('')).toBe('');
    });

    it('should convert number to string', () => {
      expect(echo(42)).toBe('42');
      expect(echo(3.14)).toBe('3.14');
      expect(echo(-100)).toBe('-100');
    });

    it('should convert boolean to string', () => {
      expect(echo(true)).toBe('true');
      expect(echo(false)).toBe('false');
    });
  });

  describe('objects and arrays', () => {
    it('should pretty-print object as JSON', () => {
      const result = echo({ name: 'test', value: 123 });

      expect(result).toBe('{\n  "name": "test",\n  "value": 123\n}');
    });

    it('should pretty-print array as JSON', () => {
      const result = echo([1, 2, 3]);

      expect(result).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should pretty-print nested objects', () => {
      const result = echo({ outer: { inner: 'value' } });

      expect(result).toContain('"outer"');
      expect(result).toContain('"inner"');
      expect(result).toContain('"value"');
    });

    it('should handle empty object', () => {
      expect(echo({})).toBe('{}');
    });

    it('should handle empty array', () => {
      expect(echo([])).toBe('[]');
    });

    it('should fall back to String() for circular references', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular.self = circular;

      const result = echo(circular);

      expect(result).toBe('[object Object]');
    });
  });
});

describe('help command', () => {
  it('should display header', () => {
    const help = createHelpCommand(() => []);
    const result = help.fn();

    expect(result).toContain('Available commands:');
  });

  it('should list all commands with descriptions', () => {
    const commands = [
      getMockCommand({ name: 'foo', description: 'Does foo things' }),
      getMockCommand({ name: 'bar', description: 'Does bar things' }),
    ];

    const help = createHelpCommand(() => commands);
    const result = help.fn();

    expect(result).toContain('foo()');
    expect(result).toContain('Does foo things');
    expect(result).toContain('bar()');
    expect(result).toContain('Does bar things');
  });

  it('should sort commands alphabetically', () => {
    const commands = [
      getMockCommand({ name: 'zebra', description: 'Last' }),
      getMockCommand({ name: 'alpha', description: 'First' }),
      getMockCommand({ name: 'middle', description: 'Middle' }),
    ];

    const help = createHelpCommand(() => commands);
    const result = String(help.fn());

    const alphaIndex = result.indexOf('alpha');
    const middleIndex = result.indexOf('middle');
    const zebraIndex = result.indexOf('zebra');

    expect(alphaIndex).toBeLessThan(middleIndex);
    expect(middleIndex).toBeLessThan(zebraIndex);
  });

  it('should use synopsis from manual when available', () => {
    const commands = [
      getMockCommand({
        name: 'test',
        description: 'Test command',
        manual: {
          synopsis: 'test(arg1: string, arg2?: number)',
          description: 'Full description',
        },
      }),
    ];

    const help = createHelpCommand(() => commands);
    const result = help.fn();

    expect(result).toContain('test(arg1: string, arg2?: number)');
    expect(result).not.toContain('test() -');
  });

  it('should fall back to name() when no manual', () => {
    const commands = [
      getMockCommand({
        name: 'simple',
        description: 'Simple command',
        manual: undefined,
      }),
    ];

    const help = createHelpCommand(() => commands);
    const result = help.fn();

    expect(result).toContain('simple()');
  });

  it('should handle empty command list', () => {
    const help = createHelpCommand(() => []);
    const result = help.fn();

    expect(result).toBe('Available commands:\n');
  });
});

describe('man command', () => {
  const createCommandMap = (commands: readonly Command[]): Map<string, Command> =>
    new Map(commands.map((cmd) => [cmd.name, cmd]));

  describe('error handling', () => {
    it('should throw error when no command name given', () => {
      const man = createManCommand(() => new Map());

      expect(() => man.fn()).toThrow('man: missing command name');
      expect(() => man.fn()).toThrow('Usage: man("command")');
    });

    it('should throw error for unknown command', () => {
      const man = createManCommand(() => new Map());

      expect(() => man.fn('unknown')).toThrow("man: no manual entry for 'unknown'");
    });
  });

  describe('basic sections', () => {
    it('should display header with uppercase command name', () => {
      const commands = createCommandMap([
        getMockCommand({ name: 'test', description: 'Test command' }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('test');

      expect(result).toContain('TEST(1)');
    });

    it('should display NAME section', () => {
      const commands = createCommandMap([
        getMockCommand({ name: 'foo', description: 'Does foo things' }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('foo');

      expect(result).toContain('NAME');
      expect(result).toContain('foo - Does foo things');
    });

    it('should display fallback message when no manual', () => {
      const commands = createCommandMap([
        getMockCommand({ name: 'simple', description: 'Simple', manual: undefined }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('simple');

      expect(result).toContain('No detailed manual available for this command.');
    });
  });

  describe('manual sections', () => {
    it('should display SYNOPSIS section', () => {
      const commands = createCommandMap([
        getMockCommand({
          name: 'test',
          description: 'Test',
          manual: {
            synopsis: 'test(arg: string)',
            description: 'Full description',
          },
        }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('test');

      expect(result).toContain('SYNOPSIS');
      expect(result).toContain('test(arg: string)');
    });

    it('should display DESCRIPTION section', () => {
      const commands = createCommandMap([
        getMockCommand({
          name: 'test',
          description: 'Short desc',
          manual: {
            synopsis: 'test()',
            description: 'This is the full detailed description.',
          },
        }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('test');

      expect(result).toContain('DESCRIPTION');
      expect(result).toContain('This is the full detailed description.');
    });

    it('should display ARGUMENTS section with required/optional labels', () => {
      const commands = createCommandMap([
        getMockCommand({
          name: 'test',
          description: 'Test',
          manual: {
            synopsis: 'test(path, options)',
            description: 'Description',
            arguments: [
              { name: 'path', description: 'The file path', required: true },
              { name: 'options', description: 'Optional flags', required: false },
            ],
          },
        }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('test');

      expect(result).toContain('ARGUMENTS');
      expect(result).toContain('path (required)');
      expect(result).toContain('The file path');
      expect(result).toContain('options (optional)');
      expect(result).toContain('Optional flags');
    });

    it('should not display ARGUMENTS section when empty', () => {
      const commands = createCommandMap([
        getMockCommand({
          name: 'test',
          description: 'Test',
          manual: {
            synopsis: 'test()',
            description: 'Description',
            arguments: [],
          },
        }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('test');

      expect(result).not.toContain('ARGUMENTS');
    });

    it('should display EXAMPLES section', () => {
      const commands = createCommandMap([
        getMockCommand({
          name: 'test',
          description: 'Test',
          manual: {
            synopsis: 'test()',
            description: 'Description',
            examples: [
              { command: 'test("foo")', description: 'Test with foo' },
              { command: 'test("bar")', description: 'Test with bar' },
            ],
          },
        }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('test');

      expect(result).toContain('EXAMPLES');
      expect(result).toContain('test("foo")');
      expect(result).toContain('Test with foo');
      expect(result).toContain('test("bar")');
      expect(result).toContain('Test with bar');
    });

    it('should not display EXAMPLES section when empty', () => {
      const commands = createCommandMap([
        getMockCommand({
          name: 'test',
          description: 'Test',
          manual: {
            synopsis: 'test()',
            description: 'Description',
            examples: [],
          },
        }),
      ]);

      const man = createManCommand(() => commands);
      const result = man.fn('test');

      expect(result).not.toContain('EXAMPLES');
    });
  });
});
