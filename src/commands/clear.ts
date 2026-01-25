import type { Command } from '../components/Terminal/types';

export interface ClearAction {
  __type: 'clear';
}

export const clearCommand: Command = {
  name: 'clear',
  description: 'Clear the terminal screen',
  fn: (): ClearAction => ({
    __type: 'clear',
  }),
};
