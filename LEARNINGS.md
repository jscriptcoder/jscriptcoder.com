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

### FTP requires dual-filesystem access

- **Context**: FTP `get`/`put` commands need to read from one machine and write to another simultaneously
- **Issue**: Original FileSystemContext only tracked one active filesystem via `switchMachine()`
- **Solution**: Track all machine filesystems in state, add cross-machine methods like `readFileFromMachine()`, `writeFileToMachine()`

### Session stack needed for SSH return

- **Context**: After `ssh` into a remote machine, user needs to return with `exit()`
- **Issue**: Session state was overwritten on SSH, no way to restore previous state
- **Solution**: Add `sessionStack` to SessionContext with `pushSession()`/`popSession()` methods

### Combined prompt modes simplify TerminalInput

- **Context**: Password input hides prompt and masks input; FTP username input hides prompt but shows text
- **Issue**: Had separate `passwordMode` and `hidePrompt` props with overlapping behavior
- **Solution**: Single `promptMode?: 'username' | 'password'` prop - both hide prompt and disable history/tab, only password masks

### Type assertions hide bugs

- **Context**: Using `result as AuthorData` to tell TypeScript the type
- **Issue**: Assertions bypass type checking; if result isn't actually AuthorData, runtime error
- **Solution**: Use type guards that verify the structure: `if (isAuthorData(result)) { ... }`

### Readonly arrays need explicit parameter types

- **Context**: Passing `readonly string[]` to a function expecting `string[]`
- **Issue**: TypeScript error "readonly cannot be assigned to mutable type"
- **Solution**: Update function parameters to accept `readonly string[]`

### Hardcoded values in command implementations

- **Context**: nc command had hardcoded `/home/ghost` path and "ghost" user
- **Issue**: When adding a second backdoor (webserver port 4444 as www-data), the hardcoded values broke
- **Solution**: Use dynamic context from configuration (e.g., `port.owner`) instead of hardcoding values

### Function signature mismatches in injected context

- **Context**: nc subcommands received `resolvePath` function via context injection
- **Issue**: Commands called `resolvePath(machineId, path, cwd)` but function signature was `(path, cwd)` - machineId was already captured in closure
- **Solution**: Match function signatures exactly; rename context properties to avoid confusion (e.g., `resolvePathForMachine` → `resolvePath`)

### Unnecessary feature complexity

- **Context**: nc cd command had `~` home directory shortcut handling
- **Issue**: Required dynamic home path lookup, added complexity for a feature nobody requested
- **Solution**: Remove the feature entirely - simpler is better when the feature isn't needed

### DNS resolution order matters

- **Context**: nc command checks if target is localhost
- **Issue**: Test expected "Connection refused" for localhost but got "Name or service not known" because DNS resolution runs first
- **Solution**: Tests should match actual execution order; DNS lookup → localhost check → connection

### Top-level await not supported in new Function()

- **Context**: Terminal uses `new Function()` to evaluate JavaScript expressions
- **Issue**: Users can't use `await` directly: `const log = await output(ping("host"))` fails
- **Solution**: Provide `resolve()` command to unwrap Promises; users learn about Promises organically

### Dotfile filtering is the command's responsibility, not the filesystem's

- **Context**: FTP `ls`/`lls` and NC `ls` showed dotfiles while regular `ls` hid them
- **Issue**: `listDirectoryFromMachine()` returns ALL `Object.keys(node.children)` including dotfiles — it doesn't filter
- **Solution**: Each `ls` variant must filter dotfiles itself: `entries.filter(name => showAll || !name.startsWith('.'))`
- **Key insight**: When adding a new ls-like command, always add dotfile filtering — the filesystem layer won't do it for you

### Filesystem factory `extraDirectories` replaces entire branches

- **Context**: `createFileSystem(config)` uses `extraDirectories` keys as top-level directory names
- **Issue**: Setting `var: { ... }` in `extraDirectories` replaces ALL of `/var`, not just what you specify — factory defaults for `/var/log` etc. are lost
- **Solution**: When using `extraDirectories`, include everything you want under that branch (e.g., both `/var/www` and `/var/log` content)

### curl GET vs POST resolve to different filesystem paths

- **Context**: curl simulates web servers by reading files from the remote machine's filesystem
- **Issue**: GET and POST have completely different path resolution — easy to add content in the wrong place
- **Solution**: GET reads `/var/www/html${urlPath}`, POST reads `/var/www/api/${endpoint}.json` — content must exist at the right path for the HTTP method

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
- **Example**: ping, nmap, nslookup, ssh, ftp, curl all use this pattern

### Dual-filesystem access for FTP

- **What**: FileSystemContext stores all machine filesystems in state, provides cross-machine operations
- **Why it works**: FTP can read/write between origin and remote machines without switching active filesystem
- **Example**: `readFileFromMachine(machineId, path, cwd, userType)`, `createFileOnMachine(...)`

### Session stack for connection management

- **What**: SessionContext maintains a stack of session snapshots, pushed on SSH, popped on exit
- **Why it works**: Supports nested connections (SSH into machine A, then SSH into B), clean return path
- **Example**: `pushSession(currentPath)` before SSH, `popSession()` on exit restores full state

### FTP mode with dedicated command set

- **What**: `FtpSession` state tracks origin/remote machines, Terminal switches to FTP commands when active
- **Why it works**: Clean separation between normal and FTP modes, prompt changes to `ftp>`, limited command set
- **Example**: `useFtpCommands()` hook returns FTP-specific commands when `ftpSession` is active

### Immutable file system updates with recursive helpers

- **What**: Pure functions `updateNodeAtPath()` and `addChildAtPath()` for immutable tree updates
- **Why it works**: Avoids deep cloning with JSON.parse/stringify, proper immutable updates
- **Example**: `setFileSystem(prev => updateNodeAtPath(prev, parts, node => ({ ...node, content })))`

### Dynamic service ownership via configuration

- **What**: Port configuration includes optional `owner` field with username, userType, homePath
- **Why it works**: Services (like nc backdoors) can run as different users without hardcoding in command logic
- **Example**: `{ port: 4444, service: 'elite', open: true, owner: { username: 'www-data', userType: 'user', homePath: '/var/www' } }`

### Web Crypto API for encryption puzzles

- **What**: Use `crypto.subtle.encrypt/decrypt` with AES-256-GCM for CTF encryption challenges
- **Why it works**: Browser-native, secure algorithm, async API fits AsyncOutput pattern
- **Example**: `decrypt("secret.enc", "64-char-hex-key")` decrypts base64-encoded ciphertext

### IndexedDB persistence with pre-load cache

- **What**: Save session state and filesystem patches to IndexedDB, pre-load into a module-level cache before React mounts
- **Why it works**: Player progress survives page refresh; pre-load avoids loading states or UI flashes; IndexedDB has no 5MB limit; validates data with type guards before restoring
- **Example**: `await initializeStorage()` in `main.tsx` before `createRoot().render()`; contexts read from `getCachedSessionState()` synchronously
- **Key insight**: The async-to-sync bridge (pre-load cache) is the cleanest pattern for using async storage with React's synchronous `useState` initializers. The data is tiny (sub-5ms reads), so the startup delay is imperceptible.

### Filesystem persistence via patches

- **What**: Store only user-created/modified files as patches in IndexedDB, replay on top of base filesystem at init
- **Why it works**: Small storage footprint, base filesystem updates in code still take effect, clean "factory reset" by clearing the database
- **Example**: `applyPatches(baseFileSystems, getCachedFilesystemPatches())` at init; `upsertPatch(patches, { machineId, path, content, owner })` on write
- **Key insight**: Persisting the diff instead of the full tree avoids stale data problems and keeps storage usage minimal

### localStorage to IndexedDB migration

- **What**: One-time auto-migration from localStorage to IndexedDB for returning users
- **Why it works**: Idempotent (checks IndexedDB first), removes localStorage keys after successful migration, graceful fallback if IndexedDB unavailable
- **Key insight**: Migration in the pre-load phase (before React mounts) means the app never sees a mixed state

### Command restriction wrapping over removal

- **What**: Instead of removing restricted commands from executionContext (causing "X is not defined" JS errors), wrap their `fn` with a permission-checking function
- **Why it works**: Clear "permission denied" error instead of confusing JS error; `man()` can still look up restricted commands; command metadata preserved for help text
- **Example**: Guest calls `nmap()` → `Error: permission denied: 'nmap' requires user privileges`
- **Key insight**: Filtering `commandNames` (for autocomplete) and `help()` happens separately from wrapping execution context

### Prettier + ESLint separation of concerns

- **What**: Prettier handles formatting (indentation, quotes, semicolons, line width), ESLint handles code quality (unused vars, type safety, React hooks rules)
- **Why it works**: Each tool does what it's best at. `eslint-config-prettier` disables conflicting ESLint rules so they don't fight.
- **Key insight**: Configure Prettier to match existing code style first (single quotes, semicolons, trailing commas) to minimize diff when first formatting the codebase. Run `npm run format` once to align everything, then use `npm run format:check` in CI.

### Consistent flag argument parsing across ls variants

- **What**: All `ls` commands (regular, FTP ls/lls, NC ls) share the same arg parsing pattern: filter string args, check for `-a`, find first non-flag arg as path
- **Why it works**: Consistent UX — `-a` works everywhere, dotfiles behave the same across all contexts
- **Example**: `const showAll = stringArgs.some(arg => arg.startsWith('-') && arg.includes('a'))`

### CTF flag progression through credential chains

- **What**: Flags are gated behind multi-step chains: hint file → credential → access → flag
- **Why it works**: Creates natural puzzle flow; each discovery unlocks the next step. Players can't skip ahead without finding credentials.
- **Example**: `/var/log/auth.log` mentions ftpuser → `/etc/passwd` has ftpuser's hash → crack it → FTP in → find flag in `.hidden_flag.txt`

### Per-machine server config for HTTP simulation

- **What**: Static config mapping machine IPs to server names and custom headers
- **Why it works**: Each machine's web server feels unique (Apache vs nginx, different headers)
- **Example**: webserver returns `X-Powered-By: PHP/7.4.3` and `X-Frame-Options: SAMEORIGIN`

### Cross-machine file reading for HTTP content

- **What**: curl reads `/var/www/html/` and `/var/www/api/` from remote machine filesystems via `readFileFromMachine()`
- **Why it works**: Web content lives in the same virtual filesystem as SSH/FTP content, consistent data model
- **Example**: `curl("http://webserver.local/config.php")` reads `/var/www/html/config.php` on the webserver machine

### Smart return types for mixed sync/async

- **What**: `output()` returns string for sync commands, Promise for async commands
- **Why it works**: Sync commands stay ergonomic (no await needed), async returns Promise users must handle
- **Example**: `const x = output(cat("f"))` → string; `const y = output(ping("h"))` → Promise
- **Trade-off**: Inconsistent API, but creates educational "aha" moment when user discovers Promises

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

### IndexedDB for persistence (migrated from localStorage)

- **Options considered**: No persistence, localStorage, IndexedDB, URL state
- **Decision**: IndexedDB with pre-load cache pattern
- **Rationale**: Better storage limits, structured data support, modern standard. Pre-load cache avoids loading states.
- **Trade-offs**: Async API requires pre-load bridge, but data is tiny so startup delay is imperceptible. `fake-indexeddb` needed for tests.
- **Migration**: Auto-migrates from localStorage on first run; localStorage keys removed after successful migration

### Patches approach for filesystem persistence

- **Options considered**: Persist full filesystem tree, persist only patches/diff
- **Decision**: Patches in IndexedDB
- **Rationale**: Base filesystem is already in code; only user mutations need persisting. Patches are small, deduped by machineId+path, and base filesystem updates in code still apply to returning users.
- **Trade-offs**: Need to intercept all mutation points (writeFileToMachine, createFileOnMachine), but only two exist

### Static OG image from HTML template

- **Options considered**: Dynamic server-side rendering, static SVG, HTML screenshot to PNG
- **Decision**: HTML template (`og-image.html`) screenshotted to PNG via Playwright
- **Rationale**: Full CSS control (fonts, gradients, scanlines, glow effects) produces the best visual result. SVG has font/filter limitations. Server-side rendering requires infrastructure.
- **Trade-offs**: PNG must be regenerated manually after HTML edits, but changes are rare. Playwright command: `npx playwright screenshot --viewport-size="1200,630" --full-page og-image.html og-image.png`

### Configuration-driven service ownership

- **Options considered**: Hardcoded user per command, configuration on port, separate service registry
- **Decision**: Optional `owner` field on Port type
- **Rationale**: Keeps configuration colocated, no separate registry to maintain, optional for ports that don't need it
- **Trade-offs**: Port type grows, but owner info naturally belongs with port definition

### Prettier for code formatting

- **Options considered**: ESLint formatting rules, @stylistic/eslint-plugin, Prettier, Biome
- **Decision**: Prettier with eslint-config-prettier
- **Rationale**: Industry standard, minimal config, first-class TypeScript/React/JSX support, huge editor integration. ESLint deprecated its own formatting rules.
- **Trade-offs**: Extra dependency, opinionated (but that's the point). eslint-config-prettier needed to avoid conflicts.

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

### Test utilities once, skip trivial wrappers

- **What**: Extract shared logic to utility, test the utility thoroughly, delete tests for thin wrappers
- **Why it works**: Reduces test duplication, tests follow the logic not the call sites
- **Example**: `stringify()` tested once in `stringify.test.ts`; `echo` command (trivial wrapper) has no tests

## Edge Cases

- curl to unknown host: "Could not resolve host" when DNS fails and not a valid IP
- curl to closed HTTP port: "Connection refused"
- curl to non-HTTP service port: "Connection refused" (validates service type)
- curl POST to non-API path: Returns 400 Bad Request with JSON error
- curl with -i flag: Shows full HTTP response headers before body
- SSH to localhost: Rejected with "cannot connect to localhost via SSH"
- SSH to machine without SSH port: "Connection refused"
- SSH with non-existent user: "Permission denied (publickey,password)"
- nmap on IP range: Scans sequentially with delays, shows live hosts only
- Empty command input: Silently ignored, no error
- su with dynamic users: Uses `getUsers()` context to support different machines
- FTP to localhost: Rejected with "cannot connect to localhost via FTP"
- FTP to machine without FTP port: "Connection refused"
- FTP get with permission denied: Checks both remote read and local write permissions
- FTP put with permission denied: Checks both local read and remote write permissions
- exit() when not connected: "exit: not connected to a remote machine"
- FTP username prompt accepts empty: Defaults to "anonymous"
- nc to localhost hostname: DNS resolution returns IP, then localhost check rejects
- nc to closed port: "Connection refused" after simulated delay
- nc to non-existent host: "Name or service not known"
- nc interactive mode: Only available on ports with "elite" service
- decrypt with wrong key: "Decryption failed - invalid key or corrupted data"
- decrypt with invalid key format: "invalid key format" (must be 64 hex chars)
- decrypt on directory: "Is a directory" error
- decrypt on empty file: "File is empty" error
- FTP/NC ls with only dotfiles (no -a): shows "(empty directory)" — consistent with regular ls
- curl GET to path without `/var/www/html/` content: returns 404 Not Found
- curl POST to non-existent `/var/www/api/` endpoint: returns 400 Bad Request
