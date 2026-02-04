import type { Command } from '../../components/Terminal/types';

// The backdoor's virtual filesystem contents
const BACKDOOR_FILE_CONTENTS: Readonly<Record<string, string>> = {
  'readme.txt': [
    '=== BACKDOOR v0.1 ===',
    '',
    'This backdoor was installed by ghost.',
    'Use it wisely.',
    '',
    'Hint: Check the hidden files...',
  ].join('\n'),
  'credentials.txt': [
    'Collected credentials:',
    '',
    'ghost:fun123',
    'admin:admin',
    '',
    '(these might work on other machines)',
  ].join('\n'),
  '.secret': 'FLAG{backdoor_explorer}',
};

export const ncCatCommand: Command = {
  name: 'cat',
  description: 'Read file contents',
  manual: {
    synopsis: 'cat(filename)',
    description: 'Display the contents of a file in the backdoor directory.',
    arguments: [
      { name: 'filename', description: 'File to read', required: true },
    ],
    examples: [
      { command: 'cat("readme.txt")', description: 'Read the readme file' },
    ],
  },
  fn: (...args: unknown[]): string => {
    const filename = args[0] as string | undefined;

    if (!filename) {
      throw new Error('cat: missing filename');
    }

    const content = BACKDOOR_FILE_CONTENTS[filename];
    if (content === undefined) {
      throw new Error(`cat: ${filename}: No such file`);
    }

    return content;
  },
};
