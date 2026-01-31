export interface AuthorLink {
  readonly label: string;
  readonly url: string;
}

export interface AuthorData {
  readonly name: string;
  readonly description: string;
  readonly avatar: string;
  readonly links: readonly AuthorLink[];
}

export interface PasswordPromptData {
  readonly __type: 'password_prompt';
  readonly targetUser: string;
}

export interface SshPromptData {
  readonly __type: 'ssh_prompt';
  readonly targetUser: string;
  readonly targetIP: string;
}

export interface OutputLine {
  readonly id: number;
  readonly type: 'command' | 'result' | 'error' | 'banner' | 'author';
  readonly content: string | AuthorData;
  readonly prompt?: string;
}

export interface CommandArgument {
  readonly name: string;
  readonly description: string;
  readonly required?: boolean;
}

export interface CommandExample {
  readonly command: string;
  readonly description: string;
}

export interface CommandManual {
  readonly synopsis: string;
  readonly description: string;
  readonly arguments?: readonly CommandArgument[];
  readonly examples?: readonly CommandExample[];
}

export interface Command {
  readonly name: string;
  readonly description: string;
  readonly manual?: CommandManual;
  readonly fn: (...args: unknown[]) => unknown;
}

export interface AsyncOutput {
  readonly __type: 'async';
  readonly start: (
    onLine: (line: string) => void,
    onComplete: (followUp?: SshPromptData) => void
  ) => void;
  readonly cancel?: () => void;
}
