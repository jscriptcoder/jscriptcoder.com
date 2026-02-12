import { describe, it, expect } from 'vitest';
import { darknet } from './darknet';
import type { FileNode } from '../types';

const getNode = (root: FileNode, path: readonly string[]): FileNode | undefined =>
  path.reduce<FileNode | undefined>((node, segment) => node?.children?.[segment], root);

const ghostHome = getNode(darknet, ['home', 'ghost']);

const rot13 = (text: string): string =>
  text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });

describe('Flag 13 — Code the Decoder (darknet projects/)', () => {
  it('projects/ directory exists with correct permissions', () => {
    const projects = ghostHome?.children?.['projects'];
    expect(projects).toBeDefined();
    expect(projects?.type).toBe('directory');
    expect(projects?.owner).toBe('user');
    expect(projects?.permissions.write).toContain('user');
    expect(projects?.permissions.execute).toContain('user');
  });

  it('projects/README.md mentions ROT13, nano, and node', () => {
    const readme = getNode(darknet, ['home', 'ghost', 'projects', 'README.md']);
    expect(readme).toBeDefined();
    expect(readme?.type).toBe('file');
    const content = readme?.content ?? '';
    expect(content).toContain('ROT13');
    expect(content).toContain('nano');
    expect(content).toContain('node');
  });

  it('projects/encoded_message.txt contains ROT13 text', () => {
    const encoded = getNode(darknet, ['home', 'ghost', 'projects', 'encoded_message.txt']);
    expect(encoded).toBeDefined();
    expect(encoded?.type).toBe('file');
    const content = encoded?.content ?? '';
    expect(content).toContain('SYNT{');
    expect(content).toContain('SYNT{pbqr_gur_qrpbqre}');
  });

  it('encoded_message.txt does NOT contain plaintext FLAG{', () => {
    const encoded = getNode(darknet, ['home', 'ghost', 'projects', 'encoded_message.txt']);
    const content = encoded?.content ?? '';
    expect(content).not.toMatch(/FLAG\{/);
  });

  it('ROT13 decoding produces FLAG{code_the_decoder}', () => {
    const encoded = getNode(darknet, ['home', 'ghost', 'projects', 'encoded_message.txt']);
    const content = encoded?.content ?? '';
    const decoded = rot13(content);
    expect(decoded).toContain('FLAG{code_the_decoder}');
  });

  it('ghost .bash_history hints at projects directory', () => {
    const history = getNode(darknet, ['home', 'ghost', '.bash_history']);
    expect(history).toBeDefined();
    const content = history?.content ?? '';
    expect(content).toContain('projects');
  });

  it('decoded message contains completion text mentioning author()', () => {
    const encoded = getNode(darknet, ['home', 'ghost', 'projects', 'encoded_message.txt']);
    const decoded = rot13(encoded?.content ?? '');
    expect(decoded).toContain('author()');
  });
});
