export interface OutputLine {
  id: number;
  type: 'command' | 'result' | 'error' | 'banner';
  content: string;
}

export interface Command {
  name: string;
  description: string;
  fn: (...args: unknown[]) => unknown;
}
