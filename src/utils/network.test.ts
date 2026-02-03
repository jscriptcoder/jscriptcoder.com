import { describe, it, expect } from 'vitest';
import { isValidIP, parseIPRange } from './network';

describe('isValidIP', () => {
  describe('valid IPs', () => {
    it('should return true for standard IP address', () => {
      expect(isValidIP('192.168.1.1')).toBe(true);
    });

    it('should return true for IP with all zeros', () => {
      expect(isValidIP('0.0.0.0')).toBe(true);
    });

    it('should return true for IP with max values', () => {
      expect(isValidIP('255.255.255.255')).toBe(true);
    });

    it('should return true for localhost', () => {
      expect(isValidIP('127.0.0.1')).toBe(true);
    });

    it('should return true for single digit octets', () => {
      expect(isValidIP('1.2.3.4')).toBe(true);
    });

    it('should return true for mixed digit lengths', () => {
      expect(isValidIP('10.0.100.1')).toBe(true);
    });
  });

  describe('invalid IPs', () => {
    it('should return false for empty string', () => {
      expect(isValidIP('')).toBe(false);
    });

    it('should return false for hostname', () => {
      expect(isValidIP('localhost')).toBe(false);
    });

    it('should return false for domain name', () => {
      expect(isValidIP('example.com')).toBe(false);
    });

    it('should return false for IP with letters', () => {
      expect(isValidIP('192.168.1.a')).toBe(false);
    });

    it('should return false for IP with too few octets', () => {
      expect(isValidIP('192.168.1')).toBe(false);
    });

    it('should return false for IP with too many octets', () => {
      expect(isValidIP('192.168.1.1.1')).toBe(false);
    });

    it('should return false for IP with spaces', () => {
      expect(isValidIP('192.168.1. 1')).toBe(false);
    });

    it('should return false for IP with leading zeros format preserved', () => {
      // Note: regex allows 4-digit octets but that's technically invalid
      expect(isValidIP('192.168.1.1000')).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isValidIP('-1.0.0.0')).toBe(false);
    });

    it('should return false for IP range notation', () => {
      expect(isValidIP('192.168.1.1-254')).toBe(false);
    });
  });
});

describe('parseIPRange', () => {
  describe('valid ranges', () => {
    it('should parse standard IP range', () => {
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

    it('should parse small range', () => {
      const result = parseIPRange('192.168.1.100-110');

      expect(result).toEqual({
        baseIP: '192.168.1',
        start: 100,
        end: 110,
      });
    });

    it('should parse single IP range (start equals end)', () => {
      const result = parseIPRange('192.168.1.50-50');

      expect(result).toEqual({
        baseIP: '192.168.1',
        start: 50,
        end: 50,
      });
    });

    it('should parse range with single digit values', () => {
      const result = parseIPRange('1.2.3.1-9');

      expect(result).toEqual({
        baseIP: '1.2.3',
        start: 1,
        end: 9,
      });
    });
  });

  describe('invalid ranges', () => {
    it('should return null for plain IP address', () => {
      expect(parseIPRange('192.168.1.1')).toBeNull();
    });

    it('should return null for hostname', () => {
      expect(parseIPRange('localhost')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseIPRange('')).toBeNull();
    });

    it('should return null when start is greater than end', () => {
      expect(parseIPRange('192.168.1.100-50')).toBeNull();
    });

    it('should return null when start exceeds 255', () => {
      expect(parseIPRange('192.168.1.256-260')).toBeNull();
    });

    it('should return null when end exceeds 255', () => {
      expect(parseIPRange('192.168.1.1-256')).toBeNull();
    });

    it('should return null for negative start', () => {
      expect(parseIPRange('192.168.1.-1-10')).toBeNull();
    });

    it('should return null for invalid base IP format', () => {
      expect(parseIPRange('192.168-1-254')).toBeNull();
    });

    it('should return null for range with letters', () => {
      expect(parseIPRange('192.168.1.a-z')).toBeNull();
    });

    it('should return null for full IP range notation', () => {
      // This format is not supported (full IP to full IP)
      expect(parseIPRange('192.168.1.1-192.168.1.254')).toBeNull();
    });
  });
});
