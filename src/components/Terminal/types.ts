export interface AuthorData {
  name: string;
  description: string;
  avatar: string;
  links: { label: string; url: string }[];
}

export interface OutputLine {
  id: number;
  type: 'command' | 'result' | 'error' | 'banner' | 'author';
  content: string | AuthorData;
}

export interface Command {
  name: string;
  description: string;
  fn: (...args: unknown[]) => unknown;
}
