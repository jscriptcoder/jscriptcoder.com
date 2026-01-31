import type { Command, AuthorData } from '../components/Terminal/types';

export const authorCommand: Command = {
  name: 'author',
  description: 'Display information about the author',
  manual: {
    synopsis: 'author()',
    description: 'Display a profile card with information about the author of this terminal, including avatar, description, and social links.',
    examples: [
      { command: 'author()', description: 'Show author profile card' },
    ],
  },
  fn: (): AuthorData => ({
    __type: 'author',
    name: 'jscriptcoder',
    description: 'TODO: description about myself',
    avatar: 'https://avatars.githubusercontent.com/u/613724',
    links: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/jscriptcoder' },
      { label: 'GitHub', url: 'https://github.com/jscriptcoder' },
    ],
  }),
};
