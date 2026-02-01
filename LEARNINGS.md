# Learnings: JSHACK.ME CTF Terminal Game

## Gotchas

### Empty async output lines collapse
- **Context**: When streaming async command output with `onLine('')`
- **Issue**: Empty string content causes `<div>` to collapse, hiding the line break
- **Solution**: Render non-breaking space `'\u00A0'` for empty content in TerminalOutput

### AsyncOutput needs follow-up actions for multi-phase commands
- **Context**: SSH needs to show connection progress, then prompt for password
- **Issue**: Original AsyncOutput only had `onComplete()` with no return value
- **Solution**: Extended `onComplete(followUp?: SshPromptData)` to support triggering password mode after async phase

### Password validation differs between local and remote
- **Context**: `su` validates against /etc/passwd, `ssh` validates against remote machine users
- **Issue**: Single `validatePassword` function needed to handle both cases
- **Solution**: Check `sshTargetIP` state to determine which validation path to use

### Type assertions hide bugs
- **Context**: Using `result as AuthorData` to tell TypeScript the type
- **Issue**: Assertions bypass type checking; if result isn't actually AuthorData, runtime error
- **Solution**: Use type guards that verify the structure: `if (isAuthorData(result)) { ... }`

### Readonly arrays need explicit parameter types
- **Context**: Passing `readonly string[]` to a function expecting `string[]`
- **Issue**: TypeScript error "readonly cannot be assigned to mutable type"
- **Solution**: Update function parameters to accept `readonly string[]`

## Patterns That Worked

### Command factory pattern with context injection
- **What**: Commands are created via factory functions that receive context (hooks, state)
- **Why it works**: Keeps commands pure and testable, dependencies injected at creation
- **Example**: `createSshCommand({ getMachine, getLocalIP })`

### Special `__type` property for custom rendering
- **What**: Command results with `__type` get special handling in Terminal
- **Why it works**: Clean separation between command logic and UI rendering
- **Example**: `{ __type: 'async', start: ... }`, `{ __type: 'password_prompt', ... }`

### Async streaming with cancellation support
- **What**: AsyncOutput interface with `start(onLine, onComplete)` and optional `cancel()`
- **Why it works**: Simulates realistic delays, supports interruption, keeps Terminal in control
- **Example**: ping, nmap, nslookup all use this pattern

### Immutable file system updates with recursive helpers
- **What**: Pure functions `updateNodeAtPath()` and `addChildAtPath()` for immutable tree updates
- **Why it works**: Avoids deep cloning with JSON.parse/stringify, proper immutable updates
- **Example**: `setFileSystem(prev => updateNodeAtPath(prev, parts, node => ({ ...node, content })))`

### Readonly types throughout
- **What**: All type properties marked `readonly`, arrays as `readonly T[]`
- **Why it works**: TypeScript enforces immutability at compile time, prevents accidental mutations
- **Example**: `readonly ports: readonly Port[]` instead of `ports: Port[]`

### Type guards for discriminated unions
- **What**: Create predicate functions like `isAuthorData(value): value is AuthorData`
- **Why it works**: Replaces type assertions (`as Type`) with type-safe narrowing, compiler verifies correctness
- **Example**: `if (isAsyncOutput(result)) { result.start(...) }` - no assertion needed

### `type` over `interface` for data structures
- **What**: Use `type` for all data shapes, reserve `interface` for behavior contracts (rare)
- **Why it works**: Types support unions, intersections, mapped types better; interfaces imply extensibility we don't want
- **Example**: `type Session = { readonly username: string; ... }` instead of `interface Session { ... }`

## Decisions Made

### MD5 for password hashing
- **Options considered**: bcrypt, SHA-256, MD5, plaintext
- **Decision**: MD5
- **Rationale**: CTF game context, realistic for vulnerable systems, simple implementation
- **Trade-offs**: Not secure for real apps, but fits the "hackable system" theme

### Separate network context from file system
- **Options considered**: Unified system context, separate contexts
- **Decision**: Separate NetworkContext and FileSystemContext
- **Rationale**: Different concerns, network is read-only simulation, filesystem has mutations
- **Trade-offs**: More context providers, but cleaner separation

### Session state for user/machine switching
- **Options considered**: Props drilling, global state, context
- **Decision**: SessionContext with username, userType, machine
- **Rationale**: Terminal prompt needs this everywhere, natural fit for context
- **Trade-offs**: Context re-renders, but minimal impact

### Functional programming style
- **Options considered**: OOP with classes, imperative style, functional
- **Decision**: Functional with immutable data, pure functions, readonly types
- **Rationale**: Better for React (immutability helps reconciliation), easier to test, prevents bugs
- **Trade-offs**: More verbose updates (spread operators), learning curve for mutation-heavy code

### Type guards over type assertions
- **Options considered**: Type assertions (`as Type`), type guards, runtime validation libraries
- **Decision**: Type guard functions for discriminated unions
- **Rationale**: Compiler-verified correctness, no runtime overhead, self-documenting code
- **Trade-offs**: More boilerplate (one function per variant), but safer and cleaner usage

### `type` keyword for all data structures
- **Options considered**: `interface` everywhere, `type` everywhere, mixed approach
- **Decision**: `type` for data, `interface` only for behavior contracts (none currently)
- **Rationale**: Consistent style, types handle unions/intersections better, no accidental extension
- **Trade-offs**: Slightly different syntax (= vs {), but more explicit about intent

## Testing Patterns

### Factory functions for mock contexts
- **What**: Create `createMockContext(config)` functions that return complete mock objects with sensible defaults
- **Why it works**: Tests are isolated, each test gets fresh state, easy to override specific values
- **Example**: `const context = createMockFileSystemContext({ userType: 'guest', fileSystem: { '/root': restrictedDir } })`

### Fake timers for async commands
- **What**: Use `vi.useFakeTimers()` and `vi.advanceTimersByTime(ms)` to test async streaming commands
- **Why it works**: Tests run instantly, deterministic timing, can test intermediate states
- **Example**: `vi.advanceTimersByTime(800)` to trigger first ping response

### Type guards for async output validation
- **What**: Create `isAsyncOutput(value)` type guard to safely check command returns AsyncOutput
- **Why it works**: TypeScript narrows the type, tests can safely call `result.start()` and `result.cancel()`
- **Example**: `if (isAsyncOutput(result)) { result.start(onLine, onComplete); }`

### Behavior-focused test grouping
- **What**: Group tests by command behavior (e.g., "error handling", "listing", "formatting") not by implementation
- **Why it works**: Tests remain valid when implementation changes, documents expected behavior
- **Example**: `describe('error handling', () => { ... })`, `describe('ping execution', () => { ... })`

## Edge Cases

- SSH to localhost: Rejected with "cannot connect to localhost via SSH"
- SSH to machine without SSH port: "Connection refused"
- SSH with non-existent user: "Permission denied (publickey,password)"
- nmap on IP range: Scans sequentially with delays, shows live hosts only
- Empty command input: Silently ignored, no error
- su with dynamic users: Uses `getUsers()` context to support different machines
