---
name: react-testing
description: React Testing Library patterns for testing React components, hooks, and context. Use when testing React applications.
---

# React Testing Library

This skill focuses on React-specific testing patterns for the JSHACK.ME terminal application.

---

## Testing Custom Hooks

### Basic Hook Testing with renderHook

**Built into React Testing Library** (since v13):

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCommandHistory } from './useCommandHistory';

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
```

**Pattern:**
- `result.current` - Current return value of hook
- `act()` - Wrap state updates that trigger re-renders
- Each state-changing call needs its own `act()` block

### Testing Hook State Changes

```typescript
import { useVariables } from './useVariables';

it('should declare a const variable', () => {
  const { result } = renderHook(() => useVariables());

  let varResult;
  act(() => {
    varResult = result.current.handleVariableOperation('const x = 42', {});
  });

  expect(varResult).toEqual({ success: true, value: 42 });
  expect(result.current.getVariables()).toEqual({ x: 42 });
});
```

### Hooks with Parameters

```typescript
import { useAutoComplete } from './useAutoComplete';

it('should match commands with () suffix', () => {
  const { result } = renderHook(() =>
    useAutoComplete(['help', 'echo'], ['myVar'])
  );

  const completions = result.current.getCompletions('hel');

  expect(completions.matches).toHaveLength(1);
  expect(completions.matches[0]).toEqual({ name: 'help', display: 'help()' });
});
```

---

## Testing with Context Providers

### wrapper Option for Hooks

**For hooks that need context providers:**

```typescript
import { useSession } from '../context/SessionContext';
import { SessionProvider } from '../context/SessionContext';

it('should return current username', () => {
  const { result } = renderHook(() => useSession(), {
    wrapper: ({ children }) => (
      <SessionProvider>
        {children}
      </SessionProvider>
    ),
  });

  expect(result.current.username).toBe('jshacker');
});
```

### Multiple Providers

```typescript
import { SessionProvider } from '../context/SessionContext';
import { FileSystemProvider } from '../filesystem/FileSystemContext';
import { NetworkProvider } from '../network/NetworkContext';

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider>
    <FileSystemProvider>
      <NetworkProvider>
        {children}
      </NetworkProvider>
    </FileSystemProvider>
  </SessionProvider>
);

it('should access all contexts', () => {
  const { result } = renderHook(() => useCommands(), {
    wrapper: AllProviders,
  });

  expect(result.current.commands.size).toBeGreaterThan(0);
});
```

### Render Helper for Components

```typescript
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <SessionProvider>
      <FileSystemProvider>
        {ui}
      </FileSystemProvider>
    </SessionProvider>
  );
};

it('should display terminal prompt', () => {
  renderWithProviders(<TerminalInput value="" onChange={() => {}} />);

  expect(screen.getByText(/jshacker@localhost>/)).toBeInTheDocument();
});
```

---

## Testing Terminal Components

### Testing Input Components

```typescript
import userEvent from '@testing-library/user-event';

it('should call onChange when typing', async () => {
  const handleChange = vi.fn();
  const user = userEvent.setup();

  render(<TerminalInput value="" onChange={handleChange} />);

  const input = screen.getByRole('textbox');
  await user.type(input, 'ls()');

  expect(handleChange).toHaveBeenCalled();
});
```

### Testing Output Display

```typescript
it('should display command output', () => {
  const output = [
    { type: 'input' as const, content: 'ls()' },
    { type: 'output' as const, content: 'README.md  src/' },
  ];

  render(<TerminalOutput lines={output} />);

  expect(screen.getByText('ls()')).toBeInTheDocument();
  expect(screen.getByText('README.md  src/')).toBeInTheDocument();
});
```

### Testing Error States

```typescript
it('should display error messages in red', () => {
  const output = [
    { type: 'error' as const, content: 'Permission denied' },
  ];

  render(<TerminalOutput lines={output} />);

  const errorElement = screen.getByText('Permission denied');
  expect(errorElement).toHaveClass('text-red-500');
});
```

---

## act() Usage in Hook Tests

### When act() is Required

For `renderHook`, wrap **every** call that changes state:

```typescript
// ✅ CORRECT - Each navigation in separate act()
it('should navigate through history', () => {
  const { result } = renderHook(() => useCommandHistory());

  act(() => {
    result.current.addCommand('first');
    result.current.addCommand('second');
  });

  let command: string;

  act(() => {
    command = result.current.navigateUp();
  });
  expect(command!).toBe('second');

  act(() => {
    command = result.current.navigateUp();
  });
  expect(command!).toBe('first');
});
```

```typescript
// ❌ WRONG - Multiple navigations in same act() won't work correctly
act(() => {
  result.current.navigateUp();
  result.current.navigateUp();
  command = result.current.navigateUp(); // Returns wrong value
});
```

### When act() is NOT Required

For component tests, RTL handles it automatically:

```typescript
// ✅ CORRECT - RTL auto-wraps these
render(<Terminal />);
await user.type(input, 'help()');
await user.keyboard('{Enter}');
```

---

## Testing Async Behavior

### Testing with Fake Timers

For commands like `ping` and `nmap` that use `setTimeout`:

```typescript
import { vi } from 'vitest';

it('should emit lines with delays', () => {
  vi.useFakeTimers();

  const { result } = renderHook(() => useAsyncCommand());
  const onLine = vi.fn();
  const onComplete = vi.fn();

  result.current.start(onLine, onComplete);

  expect(onLine).toHaveBeenCalledWith('Starting...');

  vi.advanceTimersByTime(1000);

  expect(onLine).toHaveBeenCalledWith('Complete.');
  expect(onComplete).toHaveBeenCalled();

  vi.useRealTimers();
});
```

### Testing Loading States

```typescript
it('should show loading during async operation', async () => {
  render(<Terminal />);

  await user.type(screen.getByRole('textbox'), 'ping("192.168.1.1")');
  await user.keyboard('{Enter}');

  // Check for streaming output
  await screen.findByText(/PING 192.168.1.1/);
});
```

---

## Factory Functions for Test Data

### Hook Test Factories

Instead of `beforeEach`, use factories:

```typescript
// ✅ CORRECT - Factory function
const setupHistory = (commands: string[] = []) => {
  const { result } = renderHook(() => useCommandHistory());

  act(() => {
    commands.forEach(cmd => result.current.addCommand(cmd));
  });

  return result;
};

it('should navigate through commands', () => {
  const result = setupHistory(['pwd()', 'ls()', 'cd("/home")']);

  let command: string;
  act(() => {
    command = result.current.navigateUp();
  });

  expect(command!).toBe('cd("/home")');
});
```

```typescript
// ❌ WRONG - Shared state in beforeEach
let result;
beforeEach(() => {
  const hook = renderHook(() => useCommandHistory());
  result = hook.result;
});
```

---

## Anti-Patterns to Avoid

### 1. Testing Implementation Details

```typescript
// ❌ WRONG - Testing internal state
it('should set historyIndex', () => {
  const { result } = renderHook(() => useCommandHistory());
  act(() => result.current.navigateUp());
  expect(result.current.historyIndex).toBe(0); // Internal!
});

// ✅ CORRECT - Test behavior
it('should return last command when navigating up', () => {
  const { result } = renderHook(() => useCommandHistory());
  act(() => result.current.addCommand('ls()'));

  let command: string;
  act(() => {
    command = result.current.navigateUp();
  });

  expect(command!).toBe('ls()');
});
```

### 2. Snapshot Testing for Dynamic Content

```typescript
// ❌ WRONG - Brittle snapshots
it('should match snapshot', () => {
  const { container } = render(<TerminalOutput lines={output} />);
  expect(container).toMatchSnapshot();
});

// ✅ CORRECT - Test specific behavior
it('should display all output lines', () => {
  render(<TerminalOutput lines={output} />);
  expect(screen.getByText('command output')).toBeInTheDocument();
});
```

### 3. Manual cleanup() Calls

```typescript
// ❌ WRONG - Cleanup is automatic
afterEach(() => {
  cleanup();
});

// ✅ CORRECT - Just write tests
it('test 1', () => { /* ... */ });
it('test 2', () => { /* ... */ });
```

---

## Project-Specific Patterns

### Testing Command Factories

Commands in this project use factory functions with injected dependencies:

```typescript
import { createLsCommand } from '../commands/ls';

it('should list directory contents', () => {
  const mockContext = {
    getCurrentPath: () => '/home/jshacker',
    getNode: () => ({
      type: 'directory',
      children: { 'README.md': { type: 'file' } },
    }),
    canRead: () => ({ allowed: true }),
  };

  const ls = createLsCommand(mockContext);
  const result = ls.fn();

  expect(result).toContain('README.md');
});
```

### Testing with Type Guards

For discriminated unions with `__type`:

```typescript
import type { VariableResult } from './useVariables';

it('should return error for const reassignment', () => {
  const { result } = renderHook(() => useVariables());

  act(() => {
    result.current.handleVariableOperation('const x = 1', {});
  });

  let varResult: VariableResult | null;
  act(() => {
    varResult = result.current.handleVariableOperation('x = 2', {});
  });

  expect(varResult).toEqual({
    success: false,
    error: "Assignment to constant variable 'x'",
  });
});
```

---

## Summary Checklist

When testing React code in this project:

- [ ] Using `renderHook()` from @testing-library/react for hooks
- [ ] Wrapping state changes in `act()` for hook tests
- [ ] Using `wrapper` option for context providers
- [ ] Using factory functions instead of `beforeEach`
- [ ] Testing behavior, not implementation
- [ ] Using fake timers for async commands (ping, nmap, ssh)
- [ ] Mocking dependencies via factory function parameters
- [ ] Following the testing skill for general patterns
