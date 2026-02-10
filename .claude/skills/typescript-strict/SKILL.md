---
name: typescript-strict
description: TypeScript strict mode patterns. Use when writing any TypeScript code.
---

# TypeScript Strict Mode

## Core Rules

1. **No `any`** - ever. Use `unknown` if type is truly unknown
2. **No type assertions** (`as Type`) without justification
3. **No non-null assertions** (`!`) - use type guards or proper null handling
4. **Prefer `type` over `interface`** for data structures
5. **Reserve `interface`** for behavior contracts only

---

## Schema Organization

### Organize Schemas by Usage

**Common patterns:**

- Centralized: `src/schemas/` for shared schemas
- Co-located: Near the modules that use them
- Layered: Separate by architectural layer (if using layered/hexagonal architecture)

**Key principle:** Avoid duplicating the same validation logic across multiple files.

### Gotcha: Schema Duplication

**Common anti-pattern:**

Defining the same schema in multiple places:

- Validation logic duplicated across endpoints
- Same business rules defined in multiple adapters
- Type definitions not shared

**Why This Is Wrong:**

- ❌ Duplication creates multiple sources of truth
- ❌ Changes require updating multiple files
- ❌ Breaks DRY principle at the knowledge level
- ❌ Domain logic leaks into infrastructure code

**Solution:**

```typescript
// ✅ CORRECT - Define types once in src/network/types.ts
export type RemoteMachine = {
  readonly ip: string;
  readonly hostname: string;
  readonly ports: readonly Port[];
  readonly users: readonly RemoteUser[];
};

export type Port = {
  readonly port: number;
  readonly service: string;
  readonly open: boolean;
};
```

```typescript
// Use in multiple places
import type { RemoteMachine, Port } from '../network/types';

// In NetworkContext
const getMachine = (ip: string): RemoteMachine | undefined => {
  return config.machines.find((m) => m.ip === ip);
};

// In ssh command
const sshPort = machine.ports.find((p) => p.port === 22 && p.open);
if (!sshPort) throw new Error('Connection refused');
```

**Key Benefits:**

- ✅ Single source of truth for validation
- ✅ Schema changes propagate everywhere automatically
- ✅ Type safety maintained across codebase
- ✅ DRY principle at knowledge level

**Remember:** If validation logic is duplicated, extract it into a shared schema.

---

## Dependency Injection Pattern

### Inject Dependencies, Don't Create Them

**The Rule:**

- Dependencies are always injected via parameters
- Never use `new` to create dependencies inside functions
- Factory functions accept dependencies as parameters

### Why This Matters

Without dependency injection:

- ❌ Only one implementation possible
- ❌ Can't test with mocks (poor testability)
- ❌ Tight coupling to specific implementations
- ❌ Violates dependency inversion principle
- ❌ Can't swap implementations

With dependency injection:

- ✅ Any implementation works (in-memory, database, remote API)
- ✅ Fully testable (inject mocks for testing)
- ✅ Loose coupling
- ✅ Follows dependency inversion principle
- ✅ Runtime flexibility (configure implementation)

### Example: SSH Command

**❌ WRONG - Creating implementation internally**

```typescript
export const createSshCommand = ({ getLocalIP }: { getLocalIP: () => string }): Command => {
  // ❌ Hardcoded implementation!
  const networkConfig = createInitialNetwork();
  const getMachine = (ip: string) => networkConfig.machines.find((m) => m.ip === ip);

  return {
    name: 'ssh',
    fn: (user: string, host: string) => {
      const machine = getMachine(host); // Using hardcoded network
      // ...
    },
  };
};
```

**Why this is WRONG:**

- Only ONE network implementation possible
- Can't test with mock machines
- Can't swap network configuration
- Tight coupling to specific implementation

**✅ CORRECT - Injecting all dependencies**

```typescript
export const createSshCommand = ({
  getMachine, // ✅ Injected
  getLocalIP, // ✅ Injected
}: {
  getMachine: (ip: string) => RemoteMachine | undefined;
  getLocalIP: () => string;
}): Command => {
  return {
    name: 'ssh',
    fn: (user: string, host: string) => {
      const machine = getMachine(host); // Delegate to injected dependency
      if (!machine) throw new Error('Connection refused');
      // ...
    },
  };
};
```

**Why this is CORRECT:**

- ✅ Any network implementation works (test mocks, different configs)
- ✅ Easy to test (inject mock machines)
- ✅ Loose coupling (depends on function signatures, not implementations)
- ✅ Runtime flexibility (NetworkContext provides real implementation)

---

## Type vs Interface - Understanding WHY

The choice between `type` and `interface` is architectural, not stylistic.

### Behavior Contracts → Use `interface`

**When to use:** Interfaces define contracts that must be implemented.

**Examples**: `FileSystemContext`, `NetworkContext`, `SessionContext`

**Why `interface` for behavior contracts?**

1. **Signals implementation contracts clearly**
   - Interface communicates "this must be implemented elsewhere"
   - Type communicates "this is a data structure"

2. **Better TypeScript errors when implementing**
   - `class X implements UserRepository` gives clear errors
   - Types don't have `implements` keyword

3. **Conventional for dependency injection**
   - Standard pattern for dependency inversion
   - Clear separation between contract and implementation

4. **Class-friendly for implementations**
   - Many libraries use classes for services
   - Classes naturally implement interfaces

**Example:**

```typescript
// Behavior contract for file system operations
interface FileSystemContextValue {
  readonly getNode: (path: string) => FileNode | null;
  readonly canRead: (path: string, userType: UserType) => PermissionResult;
  readonly canWrite: (path: string, userType: UserType) => PermissionResult;
  readonly readFile: (path: string, userType: UserType) => string | null;
}

// Behavior contract for network operations
interface NetworkContextType {
  readonly getMachine: (ip: string) => RemoteMachine | undefined;
  readonly getMachines: () => readonly RemoteMachine[];
  readonly resolveDomain: (domain: string) => DnsRecord | undefined;
}
```

### Data Structures → Use `type`

**When to use:** Types define immutable data structures.

**Examples**: `FileNode`, `RemoteMachine`, `Session`, `OutputLine`

**Why `type` for data?**

1. **Emphasizes immutability**
   - Types with `readonly` signal "don't mutate this"
   - Functional programming alignment

2. **Better for unions, intersections, mapped types**
   - `type Result<T, E> = Success<T> | Failure<E>`
   - `type Partial<T> = { [P in keyof T]?: T[P] }`

3. **Prevents accidental mutations**
   - `readonly` properties enforce immutability at type level
   - Compiler catches mutation attempts

4. **More flexible composition**
   - Easier to compose with utility types
   - Better inference in complex scenarios

**Example:**

```typescript
// Data structure for file system node
export type FileNode = {
  readonly name: string;
  readonly type: 'file' | 'directory';
  readonly owner: UserType;
  readonly permissions: FilePermissions;
  readonly content?: string;
  readonly children?: Readonly<Record<string, FileNode>>;
};

// Data structure for network machine
export type RemoteMachine = {
  readonly ip: string;
  readonly hostname: string;
  readonly ports: readonly Port[];
  readonly users: readonly RemoteUser[];
};
```

### Architectural Pattern

This pattern supports clean architecture:

- **Behavior contracts** (`interface`) = Boundaries between layers
- **Data structures** (`type`) = Data flowing through the system
- **Business logic** depends on interfaces, not implementations
- **Data** is immutable (types with `readonly`)

---

## Strict Mode Configuration

### tsconfig.json Settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "allowUnusedLabels": false
  }
}
```

### What Each Setting Does

**Core strict flags:**

- **`strict: true`** - Enables all strict type checking options
- **`noImplicitAny`** - Error on expressions/declarations with implied `any` type
- **`strictNullChecks`** - `null` and `undefined` have their own types (not assignable to everything)
- **`noUnusedLocals`** - Error on unused local variables
- **`noUnusedParameters`** - Error on unused function parameters
- **`noImplicitReturns`** - Error when not all code paths return a value
- **`noFallthroughCasesInSwitch`** - Error on fallthrough cases in switch statements

**Additional safety flags (CRITICAL):**

- **`noUncheckedIndexedAccess`** - Array/object access returns `T | undefined` (prevents runtime errors from assuming elements exist)
- **`exactOptionalPropertyTypes`** - Distinguishes `property?: T` from `property: T | undefined` (more precise types)
- **`noPropertyAccessFromIndexSignature`** - Requires bracket notation for index signature properties (forces awareness of dynamic access)
- **`forceConsistentCasingInFileNames`** - Prevents case sensitivity issues across operating systems
- **`allowUnusedLabels`** - Error on unused labels (catches accidental labels that do nothing)

### Additional Rules

- **No `@ts-ignore`** without explicit comments explaining why
- **These rules apply to test code as well as production code**

### Architectural Insight: noUnusedParameters Catches Design Issues

The `noUnusedParameters` rule can reveal architectural problems:

**Example**: A function with an unused parameter often indicates the parameter belongs in a different layer. Strict mode catches these design issues early.

---

## Immutability Patterns

### Use `readonly` on All Data Structures

```typescript
// ✅ CORRECT - Immutable data structure
type Command = {
  readonly name: string;
  readonly description: string;
  readonly manual?: CommandManual;
  readonly fn: (...args: unknown[]) => unknown;
};

// ❌ WRONG - Mutable data structure
type Command = {
  name: string;
  description: string;
  manual?: CommandManual;
  fn: (...args: unknown[]) => unknown;
};
```

### ReadonlyArray vs Array

```typescript
// ✅ CORRECT - Immutable array
type NetworkConfig = {
  readonly interfaces: readonly NetworkInterface[];
  readonly machines: readonly RemoteMachine[];
  readonly dnsRecords: readonly DnsRecord[];
};

// ❌ WRONG - Mutable array
type NetworkConfig = {
  readonly interfaces: NetworkInterface[];
  readonly machines: RemoteMachine[];
};
```

### Result Type Pattern for Error Handling

Prefer `Result<T, E>` types over exceptions for expected errors:

```typescript
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Usage in file system
export type PermissionResult = {
  readonly allowed: boolean;
  readonly error?: string;
};

const canRead = (path: string, userType: UserType): PermissionResult => {
  const node = getNode(path);
  if (!node) return { allowed: false, error: `No such file: ${path}` };
  if (!node.permissions.read.includes(userType)) {
    return { allowed: false, error: `Permission denied: ${path}` };
  }
  return { allowed: true };
};
```

**Why result types?**

- Explicit error handling (type system enforces checking)
- No hidden control flow (unlike exceptions)
- Functional programming alignment
- Easier to test (no try/catch needed)

---

## Factory Pattern for Object Creation

### Use Factory Functions (Not Classes)

```typescript
// ✅ CORRECT - Factory function for commands
export const createNmapCommand = (context: {
  readonly getMachine: (ip: string) => RemoteMachine | undefined;
  readonly getMachines: () => readonly RemoteMachine[];
  readonly getLocalIP: () => string;
}): Command => {
  const { getMachine, getMachines, getLocalIP } = context;

  return {
    name: 'nmap',
    description: 'Network exploration and port scanning',
    fn: (target: string): AsyncOutput => {
      const machine = getMachine(target);
      if (!machine) throw new Error(`Host ${target} not found`);
      // Return async output...
    },
  };
};

// ❌ WRONG - Class-based creation
export class NmapCommand {
  constructor(private getMachine: (ip: string) => RemoteMachine | undefined) {}

  execute(target: string) {
    // Implementation with `this`
  }
}
```

**Why factory functions?**

- Functional programming alignment
- No `this` context issues
- Easier to compose
- Natural dependency injection
- Simpler testing (no `new` keyword)

---

## Location Guidance

### Project File Organization

This project uses the following structure:

**Types (Data Structures)**

- Location: Co-located with features (`src/filesystem/types.ts`, `src/network/types.ts`)
- Examples: `FileNode`, `RemoteMachine`, `OutputLine`, `Command`
- Why: Types stay close to the code that uses them

**Context Providers (State & Behavior)**

- Location: `src/context/`, `src/filesystem/`, `src/network/`
- Examples: `SessionContext`, `FileSystemContext`, `NetworkContext`
- Why: React context for global state, provides behavior contracts

**Commands (Terminal Commands)**

- Location: `src/commands/`
- Examples: `createLsCommand`, `createSshCommand`, `createNmapCommand`
- Why: Factory functions that create command objects with injected dependencies

**Hooks (React Hooks)**

- Location: `src/hooks/`
- Examples: `useCommands`, `useVariables`, `useCommandHistory`
- Why: Custom hooks for terminal behavior

**Components (UI)**

- Location: `src/components/Terminal/`
- Examples: `Terminal`, `TerminalInput`, `TerminalOutput`
- Why: React components for the terminal UI

**Key principles for this project:**

- Types co-located with features
- Commands use factory pattern with dependency injection
- Context providers define behavior contracts
- Immutable data throughout

---

## Schema-First at Trust Boundaries

### When Schemas ARE Required

- Data crosses trust boundary (external → internal)
- Type has validation rules (format, constraints)
- Shared data contract between systems
- Used in test factories (validate test data completeness)

```typescript
// API responses, user input, external data
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});
type User = z.infer<typeof UserSchema>;

// Validate at boundary
const user = UserSchema.parse(apiResponse);
```

### When Schemas AREN'T Required

- Pure internal types (utilities, state)
- Result/Option types (no validation needed)
- TypeScript utility types (`Partial<T>`, `Pick<T>`, etc.)
- Behavior contracts (interfaces - structural, not validated)
- Component props (unless from URL/API)

```typescript
// ✅ CORRECT - No schema needed
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

// ✅ CORRECT - Interface, no validation
interface UserService {
  createUser(user: User): void;
}
```

---

## Avoid Non-Null Assertion Operator

The non-null assertion operator (`!`) tells TypeScript to trust that a value is not `null` or `undefined`. This bypasses type safety and can lead to runtime errors.

### Why It's Problematic

```typescript
// ❌ WRONG - Non-null assertion
const user = getUser(id);
const name = user!.name; // Runtime error if user is undefined

// ❌ WRONG - Chained assertions
const length = data!.items!.length; // Multiple points of failure
```

**Problems:**

- Bypasses `strictNullChecks` - defeats the purpose of strict mode
- Runtime errors when assumption is wrong
- Similar to `as Type` - you're lying to the compiler
- Hides potential bugs instead of handling them

### Better Alternatives

**1. Type guards with early return:**

```typescript
// ✅ CORRECT - Type guard
const user = getUser(id);
if (!user) {
  throw new Error(`User ${id} not found`);
}
// TypeScript knows user is defined here
const name = user.name;
```

**2. Optional chaining with nullish coalescing:**

```typescript
// ✅ CORRECT - Safe access with default
const name = user?.name ?? 'Anonymous';
const length = data?.items?.length ?? 0;
```

**3. Explicit error handling:**

```typescript
// ✅ CORRECT - Handle the null case
const machine = getMachine(ip);
if (!machine) {
  return { success: false, error: `Host ${ip} not found` };
}
// TypeScript knows machine is defined
const ports = machine.ports;
```

**4. Proper typing that can't be null:**

```typescript
// ✅ CORRECT - Design types to avoid nullability
type User = {
  readonly name: string; // Required, not optional
  readonly email: string;
};

// Instead of checking for null, ensure creation is valid
const createUser = (name: string, email: string): User => ({ name, email });
```

### Acceptable Exception: Test Files

In test files, `!` may be acceptable when:

- You control the test data and know it's defined
- Tests will fail anyway if the value is undefined
- The alternative makes tests significantly harder to read

```typescript
// Acceptable in tests - act() callback pattern
let result: SomeType | null;
act(() => {
  result = someOperation();
});
expect(result!.value).toBe(expected); // Test fails if null
```

**However**, prefer restructuring tests to avoid needing `!` when possible.

### Key Principle

If you find yourself reaching for `!`, ask:

1. Can I restructure the code to avoid nullability?
2. Can I use a type guard to narrow the type?
3. Can I use optional chaining with a sensible default?
4. Should I throw an explicit error for this case?

The answer to at least one of these is almost always "yes".

---

## Functional Programming Principles

These principles support immutability and type safety:

### Pure Functions

- No side effects (don't mutate external state)
- Deterministic (same input → same output)
- Easier to reason about, test, and compose

```typescript
// ✅ CORRECT - Pure function
const addOutputLine = (
  lines: readonly OutputLine[],
  newLine: OutputLine,
): readonly OutputLine[] => {
  return [...lines, newLine]; // Returns new array
};

// ❌ WRONG - Impure function (mutates)
const addOutputLine = (lines: OutputLine[], newLine: OutputLine): void => {
  lines.push(newLine); // Mutates input!
};
```

### No Data Mutation

- Use spread operators for immutable updates
- Return new objects/arrays instead of modifying
- Let TypeScript's `readonly` enforce this

```typescript
// ✅ CORRECT - Immutable update
const updateSession = (session: Session, updates: Partial<Session>): Session => {
  return { ...session, ...updates }; // New object
};

// ❌ WRONG - Mutation
const updateSession = (session: Session, updates: Partial<Session>): void => {
  Object.assign(session, updates); // Mutates!
};
```

### Composition Over Complex Logic

- Compose small functions into larger ones
- Each function does one thing well
- Easier to understand, test, and reuse

```typescript
// ✅ CORRECT - Composed functions
const normalizePath = (path: string): string => {
  /* ... */
};
const getNode = (path: string): FileNode | null => {
  /* ... */
};
const canRead = (path: string, userType: UserType): boolean =>
  getNode(normalizePath(path))?.permissions.read.includes(userType) ?? false;

// ❌ WRONG - Complex monolithic function
const canRead = (path: string, userType: UserType): boolean => {
  const parts = path.split('/').filter(Boolean);
  let current = fileSystem;
  for (const part of parts) {
    /* ... nested logic ... */
  }
  // ... 30 more lines
};
```

### Use Array Methods Over Loops

- Prefer `map`, `filter`, `reduce` for transformations
- Declarative (what, not how)
- Natural immutability (return new arrays)

```typescript
// ✅ CORRECT - Functional array methods
const openPorts = machine.ports.filter((p) => p.open);
const serviceNames = openPorts.map((p) => p.service);

// ❌ WRONG - Imperative loops
const openPorts = [];
for (const p of machine.ports) {
  if (p.open) {
    openPorts.push(p);
  }
}
```

---

## Branded Types

For type-safe primitives:

```typescript
type IPAddress = string & { readonly brand: unique symbol };
type PasswordHash = string & { readonly brand: unique symbol };

// Type-safe at compile time
const validatePassword = (hash: PasswordHash, storedHash: PasswordHash): boolean => {
  return hash === storedHash;
};

// ❌ Can't pass raw string
validatePassword('abc123', 'def456'); // Error

// ✅ Must use branded type
const inputHash = md5(password) as PasswordHash;
const storedHash = user.passwordHash as PasswordHash;
validatePassword(inputHash, storedHash); // OK
```

---

## Summary Checklist

When writing TypeScript code, verify:

- [ ] No `any` types - using `unknown` where type is truly unknown
- [ ] No type assertions (`as Type`) without justification
- [ ] No non-null assertions (`!`) - use type guards or optional chaining
- [ ] Using `type` for data structures with `readonly`
- [ ] Using `interface` for behavior contracts (ports)
- [ ] Schemas defined in core, not duplicated in adapters
- [ ] Ports injected via parameters, never created internally
- [ ] Factory functions for object creation (not classes)
- [ ] `readonly` on all data structure properties
- [ ] Pure functions wherever possible (no mutations)
- [ ] Result types for expected errors (not exceptions)
- [ ] Strict mode enabled with all checks passing
- [ ] Artifacts in correct locations (ports/, types/, schemas/, domain/)
