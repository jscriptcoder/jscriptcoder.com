import type { Command } from '../../components/Terminal/types';

// Virtual filesystem contents
const FILE_CONTENTS: Readonly<Record<string, string>> = {
  'readme.txt': [
    '# maintenance port',
    '',
    'do not share access',
    '- ghost',
  ].join('\n'),
  'credentials.txt': [
    'ghost:fun123',
    'admin:admin',
  ].join('\n'),
  '.secret': 'FLAG{31337_access}',
};

export const ncCatCommand: Command = {
  name: 'cat',
  description: 'Read file contents',
  manual: {
    synopsis: 'cat(filename)',
    description: 'Display file contents.',
    arguments: [
      { name: 'filename', description: 'File to read', required: true },
    ],
    examples: [
      { command: 'cat("readme.txt")', description: 'Read a file' },
    ],
  },
  fn: (...args: unknown[]): string => {
    const filename = args[0] as string | undefined;

    if (!filename) {
      throw new Error('cat: missing filename');
    }

    const content = FILE_CONTENTS[filename];
    if (content === undefined) {
      throw new Error(`cat: ${filename}: No such file`);
    }

    return content;
  },
};
