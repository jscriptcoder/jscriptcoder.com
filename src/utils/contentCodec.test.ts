import { describe, it, expect } from 'vitest';
import { encodeContent, decodeContent, encodeFileSystem, decodeFileSystem } from './contentCodec';
import type { FileNode } from '../filesystem/types';

describe('encodeContent / decodeContent', () => {
  it('round-trips a simple string', () => {
    const plain = 'FLAG{welcome_hacker}';
    expect(decodeContent(encodeContent(plain))).toBe(plain);
  });

  it('round-trips an empty string', () => {
    expect(decodeContent(encodeContent(''))).toBe('');
  });

  it('round-trips multiline content with special characters', () => {
    const plain = '=== WELCOME ===\nLine 2\tTabbed\n\nFLAG{test_flag}\n';
    expect(decodeContent(encodeContent(plain))).toBe(plain);
  });

  it('produces output different from input', () => {
    const plain = 'FLAG{secret}';
    const encoded = encodeContent(plain);
    expect(encoded).not.toBe(plain);
    expect(encoded).not.toContain('FLAG');
  });
});

describe('encodeFileSystem / decodeFileSystem', () => {
  const makeTree = (): FileNode => ({
    name: '/',
    type: 'directory',
    owner: 'root',
    permissions: { read: ['root'], write: ['root'], execute: ['root'] },
    children: {
      'readme.txt': {
        name: 'readme.txt',
        type: 'file',
        owner: 'user',
        permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
        content: 'FLAG{tree_test}',
      },
      etc: {
        name: 'etc',
        type: 'directory',
        owner: 'root',
        permissions: { read: ['root'], write: ['root'], execute: ['root'] },
        children: {
          passwd: {
            name: 'passwd',
            type: 'file',
            owner: 'root',
            permissions: { read: ['root'], write: ['root'], execute: ['root'] },
            content: 'root:hash:0:0:root:/root:/bin/bash',
          },
        },
      },
      emptydir: {
        name: 'emptydir',
        type: 'directory',
        owner: 'root',
        permissions: { read: ['root'], write: ['root'], execute: ['root'] },
      },
    },
  });

  it('round-trips a full FileNode tree', () => {
    const original = makeTree();
    const decoded = decodeFileSystem(encodeFileSystem(original));
    expect(decoded).toEqual(original);
  });

  it('encodes all content strings', () => {
    const encoded = encodeFileSystem(makeTree());
    const readmeContent = encoded.children!['readme.txt'].content!;
    expect(readmeContent).not.toContain('FLAG');

    const passwdContent = encoded.children!['etc'].children!['passwd'].content!;
    expect(passwdContent).not.toContain('root:hash');
  });

  it('preserves structure (names, types, permissions)', () => {
    const original = makeTree();
    const encoded = encodeFileSystem(original);
    expect(encoded.name).toBe(original.name);
    expect(encoded.type).toBe(original.type);
    expect(encoded.owner).toBe(original.owner);
    expect(encoded.permissions).toEqual(original.permissions);
    expect(Object.keys(encoded.children!)).toEqual(Object.keys(original.children!));
  });

  it('handles nodes without content or children', () => {
    const node: FileNode = {
      name: 'empty',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'], execute: ['root'] },
    };
    const roundTripped = decodeFileSystem(encodeFileSystem(node));
    expect(roundTripped).toEqual(node);
  });
});
