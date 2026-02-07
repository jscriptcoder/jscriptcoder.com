import { describe, it, expect } from 'vitest';
import { hexToBytes, bytesToHex, generateKey, encryptContent, decryptContent } from './crypto';

describe('hexToBytes', () => {
  it('should convert hex string to bytes', () => {
    const result = hexToBytes('deadbeef');
    expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it('should handle uppercase hex', () => {
    const result = hexToBytes('DEADBEEF');
    expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it('should strip whitespace', () => {
    const result = hexToBytes('de ad be ef');
    expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it('should handle all zeros', () => {
    const result = hexToBytes('00000000');
    expect(result).toEqual(new Uint8Array([0, 0, 0, 0]));
  });

  it('should handle all ff', () => {
    const result = hexToBytes('ffffffff');
    expect(result).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
  });

  it('should return empty array for empty string', () => {
    const result = hexToBytes('');
    expect(result).toEqual(new Uint8Array([]));
  });

  it('should handle 64-char hex key (256-bit)', () => {
    const hex = 'a'.repeat(64);
    const result = hexToBytes(hex);
    expect(result.length).toBe(32);
    expect(result.every((b) => b === 0xaa)).toBe(true);
  });
});

describe('bytesToHex', () => {
  it('should convert bytes to hex string', () => {
    const result = bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
    expect(result).toBe('deadbeef');
  });

  it('should zero-pad single digit values', () => {
    const result = bytesToHex(new Uint8Array([0x0a, 0x01, 0x00]));
    expect(result).toBe('0a0100');
  });

  it('should return empty string for empty array', () => {
    const result = bytesToHex(new Uint8Array([]));
    expect(result).toBe('');
  });

  it('should handle all zeros', () => {
    const result = bytesToHex(new Uint8Array([0, 0, 0]));
    expect(result).toBe('000000');
  });
});

describe('hexToBytes and bytesToHex round-trip', () => {
  it('should round-trip hex -> bytes -> hex', () => {
    const original = 'deadbeef01234567890abcdef0';
    const result = bytesToHex(hexToBytes(original));
    expect(result).toBe(original);
  });

  it('should round-trip bytes -> hex -> bytes', () => {
    const original = new Uint8Array([0, 127, 255, 1, 16, 128]);
    const result = hexToBytes(bytesToHex(original));
    expect(result).toEqual(original);
  });
});

describe('generateKey', () => {
  it('should return a 64-character hex string', () => {
    const key = generateKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate different keys each time', () => {
    const key1 = generateKey();
    const key2 = generateKey();
    expect(key1).not.toBe(key2);
  });
});

describe('encryptContent and decryptContent round-trip', () => {
  it('should decrypt to original plaintext', async () => {
    const key = generateKey();
    const plaintext = 'FLAG{test_crypto_roundtrip}';
    const encrypted = await encryptContent(plaintext, key);
    const decrypted = await decryptContent(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce base64 encoded output', async () => {
    const key = generateKey();
    const encrypted = await encryptContent('hello', key);
    expect(() => atob(encrypted)).not.toThrow();
  });

  it('should produce different ciphertext for same plaintext (random IV)', async () => {
    const key = generateKey();
    const encrypted1 = await encryptContent('same input', key);
    const encrypted2 = await encryptContent('same input', key);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should fail to decrypt with wrong key', async () => {
    const key1 = generateKey();
    const key2 = generateKey();
    const encrypted = await encryptContent('secret', key1);
    await expect(decryptContent(encrypted, key2)).rejects.toThrow();
  });

  it('should handle empty string', async () => {
    const key = generateKey();
    const encrypted = await encryptContent('', key);
    const decrypted = await decryptContent(encrypted, key);
    expect(decrypted).toBe('');
  });

  it('should handle unicode content', async () => {
    const key = generateKey();
    const plaintext = 'Hello 🔐 世界 émojis';
    const encrypted = await encryptContent(plaintext, key);
    const decrypted = await decryptContent(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle long content', async () => {
    const key = generateKey();
    const plaintext = 'x'.repeat(10000);
    const encrypted = await encryptContent(plaintext, key);
    const decrypted = await decryptContent(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });
});
