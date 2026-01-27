import type { Command } from '../components/Terminal/types';

export interface PasswordPromptData {
  __type: 'password_prompt';
  targetUser: string;
}

export const suCommand: Command = {
  name: 'su',
  description: 'Switch user',
  manual: {
    synopsis: 'su(username: string)',
    description:
      'Switch to another user account. You will be prompted for the password. The password is validated against MD5 hashes stored in /etc/passwd.',
    arguments: [
      {
        name: 'username',
        description: 'The username to switch to (e.g., "root", "guest")',
        required: true,
      },
    ],
    examples: [
      { command: 'su("root")', description: 'Switch to root user' },
      { command: 'su("guest")', description: 'Switch to guest user' },
    ],
  },
  fn: (...args: unknown[]): PasswordPromptData => {
    const username = args[0] as string | undefined;

    if (!username) {
      throw new Error('su: missing username\nUsage: su("username")');
    }

    const validUsers = ['root', 'jscriptcoder', 'guest'];
    if (!validUsers.includes(username)) {
      throw new Error(`su: user ${username} does not exist`);
    }

    // Return a special object that Terminal will recognize
    return {
      __type: 'password_prompt',
      targetUser: username,
    };
  },
};
