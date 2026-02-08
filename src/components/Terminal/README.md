# Terminal

The main UI component — a retro amber-on-black CRT terminal that orchestrates command execution, output rendering, input handling, and connection mode switching.

## Files

| File | Description |
|------|-------------|
| `Terminal.tsx` | Main orchestrator — manages input state, command execution, async output streaming, password/FTP/NC mode switching, and output line management |
| `TerminalInput.tsx` | Input line with prompt (`user@machine>`), cursor, key handlers (Enter, ArrowUp/Down, Tab), password masking |
| `TerminalOutput.tsx` | Renders output lines: banners, commands, results, errors, and the author profile card |
| `types.ts` | All shared types: `Command`, `OutputLine`, `AsyncOutput`, `SpecialOutput` discriminated union, type guards |
| `index.ts` | Module export |

## Command Execution Flow

```
User types input
    │
    ▼
Terminal.tsx handleSubmit()
    │
    ├── Variable operation? (const/let/reassign)
    │   └── useVariables.handleVariableOperation()
    │
    └── Command execution
        └── new Function(...context, input)
            │
            ├── Returns string → display as result
            ├── Returns { __type: 'author' } → render AuthorCard
            ├── Returns { __type: 'clear' } → clear output lines
            ├── Returns { __type: 'password_prompt' } → enter password mode
            ├── Returns { __type: 'async' } → stream output with delays
            ├── Returns { __type: 'ssh_prompt' } → async then password prompt
            ├── Returns { __type: 'ftp_prompt' } → switch to FTP commands
            ├── Returns { __type: 'nc_prompt' } → switch to NC commands
            ├── Returns { __type: 'exit' } → pop session stack
            └── Throws Error → display as error
```

## Special Output Types (`__type` discriminated union)

| Type | Trigger | Behavior |
|------|---------|----------|
| `author` | `author()` | Renders profile card with avatar, bio, links |
| `clear` | `clear()` | Clears all output lines |
| `password_prompt` | `su(user)` | Hides prompt, masks input with `*` |
| `ssh_prompt` | `ssh(user, host)` | After async delay, enters password mode for SSH |
| `ftp_prompt` | `ftp(host)` | After auth, switches to FTP command set |
| `ftp_quit` | `quit()`/`bye()` | Exits FTP mode, restores normal commands |
| `nc_prompt` | `nc(host, port)` | Switches to NC command set with `$` prompt |
| `nc_quit` | `exit()` in NC | Exits NC mode, restores normal commands |
| `exit` | `exit()` | Pops session stack, returns to previous machine |
| `async` | ping, nmap, curl, etc. | Streams lines via `onLine()`, disables input until `onComplete()` |

## Components

### Terminal (orchestrator)

- Holds all state: output lines, input value, mode flags (password, FTP username, async running)
- Wires hooks together: `useCommands`, `useFtpCommands`, `useNcCommands`, `useCommandHistory`, `useAutoComplete`, `useVariables`
- Handles password validation (local `su` via `/etc/passwd`, remote SSH via machine users)
- Shows ASCII banner on startup

### TerminalInput

- Renders prompt from `useSession().getPrompt()`
- Prompt modes: normal (`user@machine>`), FTP (`ftp>`), NC (`$`), hidden (password/username)
- Password mode: masks input with `*`, disables history/tab
- Blinking cursor animation
- Key bindings: Enter (submit), ArrowUp/Down (history), Tab (autocomplete), Ctrl+C (cancel async)

### TerminalOutput

- Renders each `OutputLine` by type:
  - `banner` — amber text, preserves whitespace
  - `command` — amber text with prompt prefix
  - `result` — amber text, indented
  - `error` — red text, indented
  - `author` — `AuthorCard` component with avatar, paragraphs, links
- Auto-scrolls to bottom on new output
