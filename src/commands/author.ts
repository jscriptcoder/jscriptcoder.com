import type { Command } from '../components/Terminal/types';

export interface AuthorInfo {
  __type: 'author';
  name: string;
  description: string;
  avatar: string;
  links: { label: string; url: string }[];
}

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
  fn: (): AuthorInfo => ({
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
