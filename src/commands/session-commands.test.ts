import { describe, it, expect } from 'vitest';
import { createSuCommand, type PasswordPromptData } from './su';

// --- Factory Functions ---

type SuContextConfig = {
  readonly users?: readonly string[];
};

const createMockSuContext = (config: SuContextConfig = {}) => {
  const { users = ['root', 'jshacker', 'guest'] } = config;

  return {
    getUsers: () => users,
  };
};

const isPasswordPromptData = (value: unknown): value is PasswordPromptData =>
  typeof value === 'object' &&
  value !== null &&
  '__type' in value &&
  (value as PasswordPromptData).__type === 'password_prompt';

// --- Tests ---

describe('su command', () => {
  describe('successful user switch', () => {
    it('should return password prompt for valid user', () => {
      const context = createMockSuContext({
        users: ['root', 'admin'],
      });

      const su = createSuCommand(context);
      const result = su.fn('root');

      expect(isPasswordPromptData(result)).toBe(true);
      if (isPasswordPromptData(result)) {
        expect(result.__type).toBe('password_prompt');
        expect(result.targetUser).toBe('root');
      }
    });

    it('should accept any user from getUsers list', () => {
      const context = createMockSuContext({
        users: ['alice', 'bob', 'charlie'],
      });

      const su = createSuCommand(context);

      const result1 = su.fn('alice');
      const result2 = su.fn('bob');
      const result3 = su.fn('charlie');

      expect(isPasswordPromptData(result1)).toBe(true);
      expect(isPasswordPromptData(result2)).toBe(true);
      expect(isPasswordPromptData(result3)).toBe(true);
    });

    it('should set targetUser to requested username', () => {
      const context = createMockSuContext({
        users: ['testuser'],
      });

      const su = createSuCommand(context);
      const result = su.fn('testuser');

      if (isPasswordPromptData(result)) {
        expect(result.targetUser).toBe('testuser');
      }
    });
  });

  describe('error handling', () => {
    it('should throw error when no username given', () => {
      const context = createMockSuContext();
      const su = createSuCommand(context);

      expect(() => su.fn()).toThrow('su: missing username');
      expect(() => su.fn()).toThrow('Usage: su("username")');
    });

    it('should throw error when username is undefined', () => {
      const context = createMockSuContext();
      const su = createSuCommand(context);

      expect(() => su.fn(undefined)).toThrow('su: missing username');
    });

    it('should throw error for non-existent user', () => {
      const context = createMockSuContext({
        users: ['root', 'admin'],
      });

      const su = createSuCommand(context);

      expect(() => su.fn('nobody')).toThrow('su: user nobody does not exist');
    });

    it('should throw error when user list is empty', () => {
      const context = createMockSuContext({
        users: [],
      });

      const su = createSuCommand(context);

      expect(() => su.fn('root')).toThrow('su: user root does not exist');
    });
  });

  describe('dynamic user list', () => {
    it('should use users from context for localhost', () => {
      const context = createMockSuContext({
        users: ['root', 'jshacker', 'guest'],
      });

      const su = createSuCommand(context);

      expect(() => su.fn('jshacker')).not.toThrow();
      expect(() => su.fn('ftpuser')).toThrow('does not exist');
    });

    it('should use different users for remote machine', () => {
      const context = createMockSuContext({
        users: ['root', 'ftpuser'],
      });

      const su = createSuCommand(context);

      expect(() => su.fn('ftpuser')).not.toThrow();
      expect(() => su.fn('jshacker')).toThrow('does not exist');
    });
  });
});
