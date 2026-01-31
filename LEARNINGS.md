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

## Edge Cases

- SSH to localhost: Rejected with "cannot connect to localhost via SSH"
- SSH to machine without SSH port: "Connection refused"
- SSH with non-existent user: "Permission denied (publickey,password)"
- nmap on IP range: Scans sequentially with delays, shows live hosts only
- Empty command input: Silently ignored, no error
