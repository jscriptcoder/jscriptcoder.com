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

export interface SshPromptData {
  __type: 'ssh_prompt';
  targetUser: string;
  targetIP: string;
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

// Async output for commands that stream results with delays
export interface AsyncOutput {
  __type: 'async';
  // Called by Terminal to start receiving output
  // onLine: callback to add a line of output
  // onComplete: callback when all output is done, optionally with a follow-up action
  start: (
    onLine: (line: string) => void,
    onComplete: (followUp?: SshPromptData) => void
  ) => void;
  // Called to cancel ongoing operation (e.g., Ctrl+C)
  cancel?: () => void;
}
