# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JscriptCoder** is a web-based JavaScript terminal emulator with a retro amber-on-black CRT aesthetic. It allows users to execute JavaScript expressions and custom commands in a terminal-like interface. Features a virtual file system with Unix-like permissions for CTF-style hacking puzzles. Deployed on Vercel at jscriptcoder.com.

## Build & Development Commands

```bash
npm run dev           # Start Vite dev server (http://localhost:5173)
npm run build         # TypeScript compile + Vite production build
npm run lint          # Run ESLint
npm run preview       # Preview production build
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage
```

## Tech Stack

- **React 19** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling (via `@tailwindcss/vite` plugin)
- **Vitest** + **React Testing Library** - Testing

## Project Structure

```
src/
├── components/Terminal/
│   ├── Terminal.tsx        # Main orchestrator component
│   ├── TerminalInput.tsx   # Input line with prompt
│   ├── TerminalOutput.tsx  # Output display (text, errors, cards)
│   └── types.ts            # TypeScript interfaces (Command, CommandManual, AsyncOutput)
├── context/
│   └── SessionContext.tsx  # Global session state (user, machine, prompt)
├── filesystem/
│   ├── FileSystemContext.tsx  # Virtual filesystem context and operations
│   ├── initialFileSystem.ts   # File system structure with passwords
│   └── types.ts               # FileNode, FilePermissions types
├── hooks/
│   ├── useCommandHistory.ts      # Up/down arrow command history
│   ├── useAutoComplete.ts        # Tab completion for commands and variables
│   ├── useVariables.ts           # const/let variable management
│   ├── useFileSystemCommands.ts  # pwd, ls, cd, cat, whoami command creation
│   ├── useNetworkCommands.ts     # ifconfig and network command creation
│   └── useCommands.ts            # Command registry and execution context
├── network/
│   ├── NetworkContext.tsx     # Network state and topology
│   ├── initialNetwork.ts      # Network configuration (machines, ports)
│   ├── types.ts               # NetworkInterface, RemoteMachine types
│   └── index.ts               # Module exports
├── commands/
│   ├── help.ts             # help() - lists available commands
│   ├── man.ts              # man(cmd) - detailed command documentation
│   ├── echo.ts             # echo(value) - outputs stringified value
│   ├── author.ts           # author() - displays author profile card
│   ├── clear.ts            # clear() - clears terminal screen
│   ├── pwd.ts              # pwd() - print working directory
│   ├── ls.ts               # ls([path]) - list directory contents
│   ├── cd.ts               # cd([path]) - change directory
│   ├── cat.ts              # cat(path) - display file contents
│   ├── su.ts               # su(user) - switch user with password prompt
│   ├── whoami.ts           # whoami() - display current username
│   ├── ifconfig.ts         # ifconfig() - display network interfaces
│   ├── ping.ts             # ping(host) - test network connectivity
│   └── nmap.ts             # nmap(target) - network scanning and port discovery
├── utils/
│   ├── md5.ts              # MD5 hashing for password validation
│   └── network.ts          # Network utilities (IP validation, range parsing)
├── test/
│   └── setup.ts            # Test setup with jest-dom
└── App.tsx                 # Root component (wraps Terminal with providers)
```

## Architecture

### Terminal Features

- **ASCII Banner**: Displays "JSHACK.ME v0.1.0" on startup
- **Dynamic Prompt**: Format `username@machine>` (e.g., `jshacker@localhost>`)
  - Managed via `SessionContext` for future multi-user/machine support
  - User types: `root`, `user`, `guest`
  - Machine names: `localhost` or IP addresses (e.g., `10.145.45.2`)
- **Command History**: Up/down arrows navigate previous commands
- **Tab Autocompletion**: Completes both commands and variables
  - Multiple matches: displays comma-separated list (e.g., `hello, help()`)
  - Single match: autocompletes directly
  - Commands shown with `()`, variables without
  - Matches sorted alphabetically
- **Variable Support**: `const`/`let` declarations with immutability enforcement
- **Virtual File System**: Unix-like directory structure with permission system

### Command Execution Flow

User input flows through `Terminal.tsx`:
1. Input is first checked for variable operations (`const`/`let` declarations or reassignments) via `useVariables` hook
2. If not a variable operation, the input is executed as a command using dynamic `new Function()` evaluation
3. Commands and variables are injected into the execution context, making them callable (e.g., `echo("hello")`)

### Adding New Commands

Commands are registered in `src/hooks/useCommands.ts`. Each command implements the `Command` interface:

```typescript
interface CommandManual {
  synopsis: string;
  description: string;
  arguments?: { name: string; description: string; required?: boolean }[];
  examples?: { command: string; description: string }[];
}

interface Command {
  name: string;
  description: string;
  manual?: CommandManual;  // For man() command documentation
  fn: (...args: unknown[]) => unknown;
}
```

To add a command:
1. Create a new file in `src/commands/` (e.g., `myCommand.ts`)
2. Export a `Command` object with `manual` field for documentation
3. Import and register it in `src/hooks/useCommands.ts` using `commands.set('name', myCommand)`

### Available Commands

| Command | Description |
|---------|-------------|
| `help()` | Lists all available commands |
| `man(cmd)` | Display detailed manual for a command |
| `echo(value)` | Outputs the stringified value |
| `author()` | Displays author profile card with avatar and links |
| `clear()` | Clears the terminal screen |
| `pwd()` | Print current working directory |
| `ls([path])` | List directory contents |
| `cd([path])` | Change current directory |
| `cat(path)` | Display file contents |
| `su(user)` | Switch user (prompts for password) |
| `whoami()` | Display current username |
| `ifconfig([iface])` | Display network interface configuration |
| `ping(host, [count])` | Send ICMP echo request to network host (async, streams output) |
| `nmap(target)` | Network exploration and port scanning (async, streams output) |

### Virtual File System

The terminal includes a virtual Unix-like file system (`src/filesystem/`):

**Directory Structure:**
```
/
├── root/           # Root user home (root only)
├── home/
│   ├── jshacker/   # Default user home
│   └── guest/      # Guest user home
├── etc/
│   └── passwd      # User passwords (MD5 hashed)
├── var/
│   └── log/        # Log files
└── tmp/            # Temporary files (world writable)
```

**Permission System:**
- Each file/directory has read/write/execute permissions per user type
- User types: `root`, `user`, `guest`
- Root has access to everything
- Regular users can access their home and shared directories
- Guests have limited access

**FileNode Structure:**
```typescript
interface FileNode {
  name: string;
  type: 'file' | 'directory';
  permissions: {
    read: UserType[];
    write: UserType[];
    execute: UserType[];
  };
  content?: string;        // For files
  children?: Record<string, FileNode>;  // For directories
}
```

### Network System

The terminal simulates a network environment for CTF puzzles (`src/network/`):

**Network Topology:**
```
192.168.1.0/24 Network
├── 192.168.1.1   (gateway)    - Router, HTTP/HTTPS open
├── 192.168.1.50  (fileserver) - FTP and SSH open
├── 192.168.1.75  (webserver)  - SSH, HTTP, MySQL open
└── 192.168.1.100 (localhost)  - Current machine
```

**NetworkInterface Structure:**
```typescript
interface NetworkInterface {
  name: string;        // e.g., 'eth0'
  flags: string[];     // e.g., ['UP', 'BROADCAST', 'RUNNING']
  inet: string;        // IP address
  netmask: string;     // Subnet mask
  gateway: string;     // Gateway IP
  mac: string;         // MAC address
}
```

**RemoteMachine Structure:**
```typescript
interface RemoteMachine {
  ip: string;
  hostname: string;
  ports: {
    port: number;
    service: string;  // 'ssh', 'ftp', 'http', etc.
    open: boolean;
  }[];
  users: {
    username: string;
    passwordHash: string;  // MD5 hashed
    userType: 'root' | 'user' | 'guest';
  }[];
}
```

**Usage in commands:**
```typescript
const { getInterfaces, getMachines, getGateway } = useNetwork();
const eth0 = getInterface('eth0');
// eth0.inet = '192.168.1.100', eth0.gateway = '192.168.1.1'
```

### Special Output Types

Commands can return special objects with `__type` property for custom rendering:

```typescript
// Example: author command returns rich card data
return {
  __type: 'author',
  name: 'jshacker',
  avatar: 'https://...',
  links: [...]
};

// Example: clear command
return { __type: 'clear' };

// Example: su command triggers password prompt mode
return { __type: 'password_prompt', targetUser: 'root' };
```

The `TerminalOutput` component checks for `__type` and renders appropriate UI (e.g., `AuthorCard` for author type). The `password_prompt` type is handled by `Terminal.tsx` which enters password mode, masking input with asterisks.

### Async Output (Streaming Commands)

Commands that simulate network operations (like `ping` and `nmap`) can return an `AsyncOutput` object to stream output with realistic delays:

```typescript
interface AsyncOutput {
  __type: 'async';
  start: (onLine: (line: string) => void, onComplete: () => void) => void;
  cancel?: () => void;
}
```

**How it works:**
1. Command returns `AsyncOutput` instead of a string
2. Terminal detects `__type: 'async'` and calls `start()`
3. Command uses `setTimeout` to emit lines via `onLine()` callback
4. Input is disabled while async command is running
5. Command calls `onComplete()` when finished

**Example implementation:**
```typescript
fn: (...args: unknown[]): AsyncOutput => {
  let cancelled = false;
  const timeoutIds: ReturnType<typeof setTimeout>[] = [];

  return {
    __type: 'async',
    start: (onLine, onComplete) => {
      onLine('Starting scan...');

      const timeoutId = setTimeout(() => {
        if (cancelled) return;
        onLine('Scan complete.');
        onComplete();
      }, 1000);
      timeoutIds.push(timeoutId);
    },
    cancel: () => {
      cancelled = true;
      timeoutIds.forEach(id => clearTimeout(id));
    },
  };
}
```

**Commands using AsyncOutput:**
- `ping(host, [count])` - ~800ms delay between each ICMP response
- `nmap(target)` - Progressive scanning with ~150ms per IP (range) or ~300ms per port (single host)

### Session Context

Global state for terminal session managed via React Context (`src/context/SessionContext.tsx`):

```typescript
interface Session {
  username: string;    // Current user (default: 'jshacker')
  userType: UserType;  // 'root' | 'user' | 'guest'
  machine: string;     // Current machine (default: 'localhost')
}
```

**Available methods:**
- `getPrompt()` - Returns formatted prompt (e.g., `jshacker@localhost>`)
- `setUsername(name, type)` - Change current user
- `setMachine(name)` - Change current machine (for future remote connections)

**Usage in commands:**
```typescript
const { setUsername, setMachine } = useSession();
setUsername('guest', 'guest');
setMachine('10.145.45.2');
// Prompt becomes: guest@10.145.45.2>
```

## Styling

- **Theme**: Retro amber-on-black (CRT monitor aesthetic)
- **Colors**: `text-amber-400`/`text-amber-500` for text, `bg-black` background, `text-red-500` for errors
- **Font**: Monospace (`font-mono`)
- **Layout**: Full viewport height, flex column with scrollable output area

## Deployment

The project is configured for Vercel deployment. Push to `main` branch triggers automatic deployment.
