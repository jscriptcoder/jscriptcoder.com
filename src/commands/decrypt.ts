import type { Command, AsyncOutput } from '../components/Terminal/types';
import type { UserType } from '../session/SessionContext';
import type { FileNode } from '../filesystem/types';
import { createCancellationToken } from '../utils/asyncCommand';

type DecryptContext = {
  readonly resolvePath: (path: string) => string;
  readonly getNode: (path: string) => FileNode | null;
  readonly getUserType: () => UserType;
};

const DECRYPT_DELAY_MS = 500;

const hexToBytes = (hex: string): Uint8Array => {
  const cleanHex = hex.replace(/\s/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const decryptContent = async (encryptedBase64: string, keyHex: string): Promise<string> => {
  const encryptedData = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  const iv = encryptedData.slice(0, 12);
  const ciphertext = encryptedData.slice(12);

  const keyBytes = hexToBytes(keyHex);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};

export const createDecryptCommand = (context: DecryptContext): Command => ({
  name: 'decrypt',
  description: 'Decrypt a file using AES-256-GCM',
  manual: {
    synopsis: 'decrypt(file: string, key: string)',
    description:
      'Decrypt an encrypted file using AES-256-GCM. ' +
      'The file should contain base64-encoded encrypted data (IV + ciphertext). ' +
      'The key should be a 64-character hex string (256 bits).',
    arguments: [
      {
        name: 'file',
        description: 'Path to the encrypted file',
        required: true,
      },
      {
        name: 'key',
        description: 'Decryption key as hex string (64 characters for AES-256)',
        required: true,
      },
    ],
    examples: [
      {
        command: 'decrypt("secret.enc", "a1b2c3...")',
        description: 'Decrypt a file with the given key',
      },
      {
        command: 'decrypt("/home/ghost/message.enc", key)',
        description: 'Decrypt using a key stored in a variable',
      },
    ],
  },
  fn: (...args: unknown[]): AsyncOutput => {
    const { resolvePath, getNode, getUserType } = context;

    const filePath = args[0] as string | undefined;
    const key = args[1] as string | undefined;

    if (!filePath) {
      throw new Error('decrypt: missing file path\nUsage: decrypt("file", "key")');
    }

    if (!key) {
      throw new Error('decrypt: missing key\nUsage: decrypt("file", "key")');
    }

    const cleanKey = key.replace(/\s/g, '');
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      throw new Error(
        'decrypt: invalid key format\nKey must be 64 hexadecimal characters (256 bits)',
      );
    }

    const userType = getUserType();
    const targetPath = resolvePath(filePath);
    const node = getNode(targetPath);

    if (!node) {
      throw new Error(`decrypt: ${filePath}: No such file or directory`);
    }

    if (node.type === 'directory') {
      throw new Error(`decrypt: ${filePath}: Is a directory`);
    }

    if (!node.permissions.read.includes(userType) && userType !== 'root') {
      throw new Error(`decrypt: ${filePath}: Permission denied`);
    }

    const encryptedContent = node.content ?? '';
    if (!encryptedContent) {
      throw new Error(`decrypt: ${filePath}: File is empty`);
    }

    const token = createCancellationToken();

    return {
      __type: 'async',
      start: (onLine, onComplete) => {
        onLine('Decrypting...');

        token.schedule(() => {
          if (token.isCancelled()) return;

          decryptContent(encryptedContent, cleanKey)
            .then((decrypted) => {
              if (token.isCancelled()) return;
              onLine('');
              onLine(decrypted);
              onComplete();
            })
            .catch(() => {
              if (token.isCancelled()) return;
              onLine('');
              onLine('Error: Decryption failed - invalid key or corrupted data');
              onComplete();
            });
        }, DECRYPT_DELAY_MS);
      },
      cancel: token.cancel,
    };
  },
});
