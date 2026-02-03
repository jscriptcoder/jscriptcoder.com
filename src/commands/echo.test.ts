import { describe, it, expect } from 'vitest';
import { echoCommand } from './echo';

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
