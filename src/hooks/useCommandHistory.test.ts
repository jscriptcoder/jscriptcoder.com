import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandHistory } from './useCommandHistory';

describe('useCommandHistory', () => {
  describe('addCommand', () => {
    it('should add command to history', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('ls()');
      });

      let command: string;
      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('ls()');
    });

    it('should not add empty commands', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('');
        result.current.addCommand('   ');
      });

      let command: string;
      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('');
    });

    it('should reset navigation index after adding', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('first');
        result.current.addCommand('second');
      });

      act(() => {
        result.current.navigateUp();
      });

      act(() => {
        result.current.addCommand('third');
      });

      // After adding, navigation should start from end
      let command: string;
      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('third');
    });
  });

  describe('navigateUp', () => {
    it('should return empty string when history is empty', () => {
      const { result } = renderHook(() => useCommandHistory());

      let command: string;
      act(() => {
        command = result.current.navigateUp();
      });

      expect(command!).toBe('');
    });

    it('should return most recent command first', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('first');
        result.current.addCommand('second');
        result.current.addCommand('third');
      });

      let command: string;
      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('third');
    });

    it('should navigate backwards through history', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('first');
        result.current.addCommand('second');
        result.current.addCommand('third');
      });

      let command: string;

      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('third');

      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('second');

      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('first');
    });

    it('should stay at oldest command when at beginning', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('first');
        result.current.addCommand('second');
      });

      let command: string;

      act(() => {
        command = result.current.navigateUp(); // second
      });

      act(() => {
        command = result.current.navigateUp(); // first
      });

      act(() => {
        command = result.current.navigateUp(); // still first
      });

      expect(command!).toBe('first');
    });
  });

  describe('navigateDown', () => {
    it('should return empty string when not navigating', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('command');
      });

      let command: string;
      act(() => {
        command = result.current.navigateDown();
      });
      expect(command!).toBe('');
    });

    it('should navigate forwards through history', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('first');
        result.current.addCommand('second');
        result.current.addCommand('third');
      });

      let command: string;

      // Go to start of history - each navigation needs separate act()
      act(() => {
        result.current.navigateUp(); // third
      });

      act(() => {
        result.current.navigateUp(); // second
      });

      act(() => {
        result.current.navigateUp(); // first
      });

      act(() => {
        command = result.current.navigateDown();
      });
      expect(command!).toBe('second');

      act(() => {
        command = result.current.navigateDown();
      });
      expect(command!).toBe('third');
    });

    it('should return empty string when navigating past end', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('first');
        result.current.addCommand('second');
      });

      let command: string;

      act(() => {
        result.current.navigateUp(); // second
        result.current.navigateUp(); // first
      });

      act(() => {
        result.current.navigateDown(); // second
        command = result.current.navigateDown(); // past end
      });

      expect(command!).toBe('');
    });
  });

  describe('resetNavigation', () => {
    it('should reset navigation to start from end', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.addCommand('first');
        result.current.addCommand('second');
        result.current.addCommand('third');
      });

      act(() => {
        result.current.navigateUp(); // third
        result.current.navigateUp(); // second
      });

      act(() => {
        result.current.resetNavigation();
      });

      // After reset, navigateUp should start from end
      let command: string;
      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('third');
    });
  });

  describe('full navigation flow', () => {
    it('should support typical terminal navigation', () => {
      const { result } = renderHook(() => useCommandHistory());

      // User types several commands
      act(() => {
        result.current.addCommand('pwd()');
        result.current.addCommand('ls()');
        result.current.addCommand('cd("/home")');
        result.current.addCommand('cat("file.txt")');
      });

      let command: string;

      // User presses up arrow to recall last command
      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('cat("file.txt")');

      // User presses up again
      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('cd("/home")');

      // User presses down to go back
      act(() => {
        command = result.current.navigateDown();
      });
      expect(command!).toBe('cat("file.txt")');

      // User presses down past end (clears input)
      act(() => {
        command = result.current.navigateDown();
      });
      expect(command!).toBe('');

      // User presses up again should start from end
      act(() => {
        command = result.current.navigateUp();
      });
      expect(command!).toBe('cat("file.txt")');
    });
  });
});
