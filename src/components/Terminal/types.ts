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
  prompt?: string; // The prompt displayed when the command was executed
}

export interface Command {
  name: string;
  description: string;
  fn: (...args: unknown[]) => unknown;
}
