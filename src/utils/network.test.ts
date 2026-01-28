import { describe, it, expect } from 'vitest';
import { isValidIP, parseIPRange } from './network';

describe('isValidIP', () => {
  it('should return true for valid IPv4 addresses', () => {
    expect(isValidIP('192.168.1.1')).toBe(true);
    expect(isValidIP('10.0.0.1')).toBe(true);
    expect(isValidIP('255.255.255.255')).toBe(true);
    expect(isValidIP('0.0.0.0')).toBe(true);
  });

  it('should return false for invalid IP addresses', () => {
    expect(isValidIP('192.168.1')).toBe(false);
    expect(isValidIP('192.168.1.1.1')).toBe(false);
    expect(isValidIP('abc.def.ghi.jkl')).toBe(false);
    expect(isValidIP('')).toBe(false);
    expect(isValidIP('localhost')).toBe(false);
  });
});

describe('parseIPRange', () => {
  it('should parse valid IP ranges', () => {
    const result = parseIPRange('192.168.1.1-254');
    expect(result).toEqual({
      baseIP: '192.168.1',
      start: 1,
      end: 254,
    });
  });

  it('should parse range starting from 0', () => {
    const result = parseIPRange('10.0.0.0-255');
    expect(result).toEqual({
      baseIP: '10.0.0',
      start: 0,
      end: 255,
    });
  });

  it('should return null for invalid range formats', () => {
    expect(parseIPRange('192.168.1.1')).toBeNull(); // No range
    expect(parseIPRange('192.168.1.1-')).toBeNull(); // Missing end
    expect(parseIPRange('192.168.1.-254')).toBeNull(); // Missing start
    expect(parseIPRange('invalid')).toBeNull();
  });

  it('should return null when start > end', () => {
    expect(parseIPRange('192.168.1.100-50')).toBeNull();
  });

  it('should return null for out of range values', () => {
    expect(parseIPRange('192.168.1.1-256')).toBeNull();
    expect(parseIPRange('192.168.1.300-254')).toBeNull();
  });
});
