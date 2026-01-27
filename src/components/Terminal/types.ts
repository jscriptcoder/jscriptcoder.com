export interface AuthorData {
  name: string;
  description: string;
  avatar: string;
  links: { label: string; url: string }[];
}

export interface PasswordPromptData {
  __type: 'password_prompt';
  targetUser: string;
}

export interface OutputLine {
  id: number;
  type: 'command' | 'result' | 'error' | 'banner' | 'author';
  content: string | AuthorData;
  prompt?: string; // The prompt displayed when the command was executed
}

export interface CommandManual {
  synopsis: string;
  description: string;
  arguments?: { name: string; description: string; required?: boolean }[];
  examples?: { command: string; description: string }[];
}

export interface Command {
  name: string;
  description: string;
  manual?: CommandManual;
  fn: (...args: unknown[]) => unknown;
}
