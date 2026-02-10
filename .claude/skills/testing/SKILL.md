---
name: testing
description: Testing patterns for behavior-driven tests. Use when writing tests or test factories.
---

# Testing Patterns

## Core Principle

**Test behavior, not implementation.** 100% coverage through business behavior, not implementation details.

**Example:** Permission checking code in `filesystem/` gets 100% coverage by testing `cat()` and `ls()` behavior, NOT by directly testing permission functions.

---

## Test Through Public API Only

Never test implementation details. Test behavior through public APIs.

**Why this matters:**

- Tests remain valid when refactoring
- Tests document intended behavior
- Tests catch real bugs, not implementation changes

### Examples

❌ **WRONG - Testing implementation:**

```typescript
// ❌ Testing HOW (implementation detail)
it('should call checkPermissions', () => {
  const spy = vi.spyOn(fs, 'checkPermissions');
  cat('/etc/passwd');
  expect(spy).toHaveBeenCalled(); // Tests HOW, not WHAT
});

// ❌ Testing private methods
it('should validate path format', () => {
  const result = fs._normalizePath('../etc'); // Private method!
  expect(result).toBe('/etc');
});

// ❌ Testing internal state
it('should set currentPath', () => {
  cd('/home');
  expect(fs.internalState.currentPath).toBe('/home'); // Internal state
});
```

✅ **CORRECT - Testing behavior through public API:**

```typescript
it('should deny access to restricted files for guest users', () => {
  const result = cat('/root/secret.txt', 'guest');
  expect(result).toContain('Permission denied');
});

it('should allow root to read any file', () => {
  const result = cat('/root/secret.txt', 'root');
  expect(result).not.toContain('Permission denied');
});

it('should list directory contents with correct format', () => {
  const result = ls('/home');
  expect(result).toContain('jshacker/');
  expect(result).toContain('guest/');
});
```

---

## Coverage Through Behavior

Permission checking code gets 100% coverage by testing the behavior it protects:

```typescript
// Tests covering permissions WITHOUT testing permission functions directly
describe('cat command', () => {
  it('should deny guest access to root files', () => {
    const result = cat('/root/secret.txt', 'guest');
    expect(result).toContain('Permission denied');
  });

  it('should deny guest access to other user home dirs', () => {
    const result = cat('/home/jshacker/.bashrc', 'guest');
    expect(result).toContain('Permission denied');
  });

  it('should allow users to read their own files', () => {
    const result = cat('/home/jshacker/README.md', 'user');
    expect(result).not.toContain('Permission denied');
  });

  it('should allow root to read any file', () => {
    const result = cat('/root/secret.txt', 'root');
    expect(result).not.toContain('Permission denied');
  });
});

// ✅ Result: filesystem permissions have 100% coverage through behavior
```

**Key insight:** When coverage drops, ask **"What business behavior am I not testing?"** not "What line am I missing?"

---

## Test Factory Pattern

For test data, use factory functions with optional overrides.

### Core Principles

1. Return complete objects with sensible defaults
2. Accept `Partial<T>` overrides for customization
3. Validate with real schemas (don't redefine)
4. NO `let`/`beforeEach` - use factories for fresh state

### Basic Pattern

```typescript
const getMockFileNode = (overrides?: Partial<FileNode>): FileNode => ({
  name: 'test.txt',
  type: 'file',
  content: 'test content',
  permissions: {
    read: ['root', 'user'],
    write: ['root'],
    execute: [],
  },
  ...overrides,
});

// Usage
it('denies write access to non-root users', () => {
  const file = getMockFileNode({ permissions: { read: ['user'], write: ['root'], execute: [] } });
  const result = writeFile(file, 'new content', 'user');
  expect(result).toContain('Permission denied');
});
```

### Complete Factory Example

```typescript
import type { RemoteMachine } from '../network/types';

const getMockMachine = (overrides?: Partial<RemoteMachine>): RemoteMachine => ({
  ip: '192.168.1.50',
  hostname: 'testserver',
  ports: [
    { port: 22, service: 'ssh', open: true },
    { port: 80, service: 'http', open: false },
  ],
  users: [
    { username: 'root', passwordHash: '63a9f0ea7bb98050796b649e85481845', userType: 'root' },
    { username: 'testuser', passwordHash: '5f4dcc3b5aa765d61d8327deb882cf99', userType: 'user' },
  ],
  ...overrides,
});
```

**Why use factory functions?**

- Ensures test data is complete and valid
- Catches breaking changes early (type errors on missing fields)
- Single source of truth (consistent test data)

### Factory Composition

For nested objects, compose factories:

```typescript
const getMockPort = (overrides?: Partial<Port>): Port => ({
  port: 22,
  service: 'ssh',
  open: true,
  ...overrides,
});

const getMockUser = (overrides?: Partial<RemoteUser>): RemoteUser => ({
  username: 'testuser',
  passwordHash: '5f4dcc3b5aa765d61d8327deb882cf99',
  userType: 'user',
  ...overrides,
});

const getMockMachine = (overrides?: Partial<RemoteMachine>): RemoteMachine => ({
  ip: '192.168.1.50',
  hostname: 'testserver',
  ports: [getMockPort()], // ✅ Compose factories
  users: [getMockUser()], // ✅ Compose factories
  ...overrides,
});

// Usage - override nested objects
it('detects machines with multiple open ports', () => {
  const machine = getMockMachine({
    ports: [
      getMockPort({ port: 22, service: 'ssh', open: true }),
      getMockPort({ port: 80, service: 'http', open: true }),
    ],
  });
  const openPorts = machine.ports.filter((p) => p.open);
  expect(openPorts.length).toBe(2);
});
```

### Anti-Patterns

❌ **WRONG: Using `let` and `beforeEach`**

```typescript
let machine: RemoteMachine;
beforeEach(() => {
  machine = { ip: '192.168.1.50', hostname: 'test', ... };  // Shared mutable state!
});

it('test 1', () => {
  machine.hostname = 'modified';  // Mutates shared state
});

it('test 2', () => {
  expect(machine.hostname).toBe('test');  // Fails! Modified by test 1
});
```

✅ **CORRECT: Factory per test**

```typescript
it('test 1', () => {
  const machine = getMockMachine({ hostname: 'modified' }); // Fresh state
  // ...
});

it('test 2', () => {
  const machine = getMockMachine(); // Fresh state, not affected by test 1
  expect(machine.hostname).toBe('testserver'); // ✅ Passes
});
```

❌ **WRONG: Incomplete objects**

```typescript
const getMockMachine = () => ({
  ip: '192.168.1.50', // Missing hostname, ports, users!
});
```

✅ **CORRECT: Complete objects**

```typescript
const getMockMachine = (overrides?: Partial<RemoteMachine>): RemoteMachine => ({
  ip: '192.168.1.50',
  hostname: 'testserver',
  ports: [{ port: 22, service: 'ssh', open: true }],
  users: [{ username: 'root', passwordHash: '...', userType: 'root' }],
  ...overrides, // All required fields present
});
```

❌ **WRONG: Redefining types in tests**

```typescript
// ❌ Type already defined in src/network/types.ts!
type RemoteMachine = { ip: string; hostname: string; };
const getMockMachine = (): RemoteMachine => ({ ... });
```

✅ **CORRECT: Import real types**

```typescript
import type { RemoteMachine } from '../network/types';

const getMockMachine = (overrides?: Partial<RemoteMachine>): RemoteMachine => ({
  ip: '192.168.1.50',
  hostname: 'testserver',
  ports: [],
  users: [],
  ...overrides,
});
```

---

## Coverage Theater Detection

Watch for these patterns that give fake 100% coverage:

### Pattern 1: Mock the function being tested

❌ **WRONG** - Gives 100% coverage but tests nothing:

```typescript
it('calls permission check', () => {
  const spy = vi.spyOn(fs, 'checkPermissions');
  cat('/etc/passwd');
  expect(spy).toHaveBeenCalled(); // Meaningless assertion
});
```

✅ **CORRECT** - Test actual behavior:

```typescript
it('should deny guest access to passwd file', () => {
  const result = cat('/etc/passwd', 'guest');
  expect(result).toContain('Permission denied');
});
```

### Pattern 2: Test only that function was called

❌ **WRONG** - No behavior validation:

```typescript
it('validates SSH connection', () => {
  const spy = vi.spyOn(network, 'getMachine');
  ssh('root', '192.168.1.50');
  expect(spy).toHaveBeenCalledWith('192.168.1.50'); // So what?
});
```

✅ **CORRECT** - Verify the outcome:

```typescript
it('should reject SSH to machine without SSH port open', () => {
  const result = ssh('root', '192.168.1.1'); // gateway has SSH closed
  expect(result).toContain('Connection refused');
});
```

### Pattern 3: Test trivial getters/setters

❌ **WRONG** - Testing implementation, not behavior:

```typescript
it('sets current path', () => {
  setCurrentPath('/home');
  expect(getCurrentPath()).toBe('/home'); // Trivial
});
```

✅ **CORRECT** - Test meaningful behavior:

```typescript
it('should resolve relative paths from current directory', () => {
  cd('/home/jshacker');
  const result = ls('.');
  expect(result).toContain('README.md');
});
```

### Pattern 4: 100% line coverage, 0% branch coverage

❌ **WRONG** - Missing edge cases:

```typescript
it('lists directory', () => {
  const result = ls('/home');
  expect(result).toBeDefined(); // Only happy path!
});
// Missing: non-existent path, file instead of dir, permission denied, etc.
```

✅ **CORRECT** - Test all branches:

```typescript
describe('ls command', () => {
  it('should return error for non-existent path', () => {
    const result = ls('/nonexistent');
    expect(result).toContain('No such file or directory');
  });

  it('should return error when listing a file', () => {
    const result = ls('/etc/passwd');
    expect(result).toContain('Not a directory');
  });

  it('should deny access to restricted directories', () => {
    const result = ls('/root', 'guest');
    expect(result).toContain('Permission denied');
  });

  it('should list directory contents', () => {
    const result = ls('/home');
    expect(result).toContain('jshacker/');
  });
});
```

---

## Colocated Tests

Place test files next to their implementation files.

✅ **CORRECT:**

```
src/
  commands/
    ls.ts
    ls.test.ts         ← Test next to implementation
    cat.ts
    cat.test.ts        ← Test next to implementation
    ssh.ts
    ssh.test.ts
  filesystem/
    FileSystemContext.tsx
    FileSystemContext.test.tsx
```

❌ **WRONG:**

```
src/
  commands/
    ls.ts
    cat.ts
    ssh.ts
tests/
  commands.test.ts     ← Far from implementation, grows unwieldy
```

**Why colocated tests:**

- **Discoverable**: `ssh.ts` → `ssh.test.ts` right next to it
- **Manageable**: Small, focused test files instead of large monoliths
- **Encourages testing**: Tests are visible when working on a file
- **Clear coverage**: Obvious which files have tests

**Important:** This is about _file organization_, not test content. Tests should still focus on behavior through public APIs, not implementation details. A colocated `ssh.test.ts` tests what `ssh()` does, not how it's implemented internally.

---

## Summary Checklist

When writing tests, verify:

- [ ] Test file colocated with implementation (`foo.ts` → `foo.test.ts`)
- [ ] Testing behavior through public API (not implementation details)
- [ ] No mocks of the function being tested
- [ ] No tests of private methods or internal state
- [ ] Factory functions return complete, valid objects
- [ ] Factories validate with real schemas (not redefined in tests)
- [ ] Using Partial<T> for type-safe overrides
- [ ] No `let`/`beforeEach` - use factories for fresh state
- [ ] Edge cases covered (not just happy path)
- [ ] Tests would pass even if implementation is refactored
