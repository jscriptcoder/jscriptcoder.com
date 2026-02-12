import { describe, it, expect } from 'vitest';
import { abyss } from './abyss';
import type { FileNode } from '../types';

const getNode = (root: FileNode, path: readonly string[]): FileNode | undefined =>
  path.reduce<FileNode | undefined>((node, segment) => node?.children?.[segment], root);

const getContent = (path: readonly string[]): string => getNode(abyss, path)?.content ?? '';

const vaultPath = ['home', 'phantom', 'vault'] as const;

describe('Flag 16 — Abyss Decryptor (XOR cipher)', () => {
  describe('XOR decode produces flag', () => {
    it('decodes encoded_payload.txt with key.txt to FLAG{abyss_decryptor}', () => {
      const hex = getContent([...vaultPath, 'encoded_payload.txt']).trim();
      const key = getContent([...vaultPath, 'key.txt']).trim();
      const decoded = hex
        .split(' ')
        .map((b: string, i: number) =>
          String.fromCharCode(parseInt(b, 16) ^ key.charCodeAt(i % key.length)),
        )
        .join('');
      expect(decoded).toBe('FLAG{abyss_decryptor}');
    });

    it('simulated node script with cat() and echo() produces the flag', () => {
      let output = '';
      const cat = (path: string): string => {
        const match = path.match(/^vault\/(.+)$/);
        return match ? getContent([...vaultPath, match[1]]) : '';
      };
      const echo = (value: string): void => {
        output = value;
      };

      const script = `
        const hex = cat("vault/encoded_payload.txt").trim()
        const key = cat("vault/key.txt").trim()
        const bytes = hex.split(" ")
        const decoded = bytes.map((b, i) =>
          String.fromCharCode(parseInt(b, 16) ^ key.charCodeAt(i % key.length))
        ).join("")
        echo(decoded)
      `;
      new Function('cat', 'echo', script)(cat, echo);
      expect(output).toBe('FLAG{abyss_decryptor}');
    });
  });

  describe('vault contents', () => {
    it('key.txt contains ABYSS', () => {
      expect(getContent([...vaultPath, 'key.txt']).trim()).toBe('ABYSS');
    });

    it('encoded_payload.txt contains space-separated hex bytes', () => {
      const payload = getContent([...vaultPath, 'encoded_payload.txt']).trim();
      const bytes = payload.split(' ');
      expect(bytes.length).toBe(21);
      bytes.forEach((b: string) => {
        expect(b).toMatch(/^[0-9a-f]{2}$/);
      });
    });

    it('cipher.txt documents the XOR algorithm', () => {
      const cipher = getContent([...vaultPath, 'cipher.txt']);
      expect(cipher).toContain('XOR');
      expect(cipher).toContain('key[i % key.length]');
    });

    it('README.txt mentions nano and node', () => {
      const readme = getContent([...vaultPath, 'README.txt']);
      expect(readme).toContain('nano()');
      expect(readme).toContain('node()');
    });
  });

  describe('credential security', () => {
    it('auth.log does NOT contain phantom password', () => {
      const authLog = getContent(['var', 'log', 'auth.log']);
      expect(authLog).not.toContain('sp3ctr4l');
      expect(authLog).not.toContain('phantom');
    });
  });
});
