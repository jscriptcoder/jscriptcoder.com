# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style: Functional Programming

**IMPORTANT:** Always follow the functional programming patterns defined in `.claude/skills/functional/SKILL.md`. Key rules:

- **Immutability**: All types use `readonly` modifiers. Never mutate data.
- **Pure functions**: No side effects where avoidable. Isolate impurity at boundaries.
- **No array mutations**: Use `slice()`, `map()`, `filter()`, spread operators. Never `push()`, `pop()`, `splice()`.
- **Array methods over loops**: Prefer `map`, `filter`, `reduce` over `for`/`for...of`.
- **Early returns**: Flatten nested conditions with guard clauses.
- **Self-documenting code**: No comments explaining what code does. Use clear naming.
- **Max 2 levels nesting**: Extract functions if deeper.

Example of correct immutable update:

```typescript
// ✅ Correct
const updated = { ...session, machine: newMachine };
const withoutLast = items.slice(0, -1);

// ❌ Wrong
session.machine = newMachine;
items.pop();
```

## Code Style: TypeScript Strict

**IMPORTANT:** Always follow the TypeScript strict patterns defined in `.claude/skills/typescript-strict/SKILL.md`. Key rules:

- **`type` over `interface`**: Use `type` for data structures. Reserve `interface` for behavior contracts (rare).
- **`readonly` everywhere**: All properties must be `readonly`. Arrays as `readonly T[]`.
- **No type assertions**: Never use `as Type`. Use type guards or proper typing instead.
- **Discriminated unions**: Use `__type` property for variants, with type guard functions.
- **No `any`**: Use `unknown` and narrow with type guards.
- **Explicit return types**: All exported functions must have explicit return types.

Example of correct type definition:

```typescript
// ✅ Correct - type with readonly
type Session = {
  readonly username: string;
  readonly userType: UserType;
  readonly machine: string;
};

// ✅ Correct - type guard for discriminated union
const isAuthorData = (value: unknown): value is AuthorData =>
  isSpecialOutput(value) && value.__type === 'author';

// ❌ Wrong - interface without readonly
interface Session {
  username: string;
  userType: UserType;
}

// ❌ Wrong - type assertion
const data = result as AuthorData;
```

## Project Overview

**JscriptCoder** is a web-based JavaScript terminal emulator with a retro amber-on-black CRT aesthetic. It allows users to execute JavaScript expressions and custom commands in a terminal-like interface. Features a virtual file system with Unix-like permissions for CTF-style hacking puzzles. Deployed on Vercel at jscriptcoder.com.

## Build & Development Commands

```bash
npm run dev           # Start Vite dev server (http://localhost:5173)
npm run build         # TypeScript compile + Vite production build
npm run lint          # Run ESLint
npm run format        # Format all files with Prettier
npm run format:check  # Check formatting without modifying (CI-friendly)
npm run preview       # Preview production build
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage
npm run test:e2e      # Run Playwright E2E test (full CTF playthrough)
```

## Tech Stack

- **React 19** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling (via `@tailwindcss/vite` plugin)
- **Prettier** - Code formatting (single quotes, semicolons, trailing commas, 100 char width)
- **Vitest** + **React Testing Library** - Unit testing
- **Playwright** - E2E testing (Chromium, full CTF playthrough)

## Project Structure

```
src/
├── components/Terminal/
│   ├── Terminal.tsx        # Main orchestrator component
│   ├── TerminalInput.tsx   # Input line with prompt
│   ├── TerminalOutput.tsx  # Output display (text, errors, cards)
│   ├── NanoEditor.tsx      # Full-screen nano-style text editor overlay
│   └── types.ts            # TypeScript types (Command, CommandManual, AsyncOutput, type guards)
├── session/
│   └── SessionContext.tsx  # Global session state (user, machine, path) with IndexedDB persistence
├── filesystem/
│   ├── FileSystemContext.tsx  # Virtual filesystem operations with IndexedDB persistence
│   ├── fileSystemFactory.ts   # Factory function for generating filesystems
│   ├── machineFileSystems.ts  # Thin assembly: imports machines, exports Record + MachineId
│   ├── machines/
│   │   ├── localhost.ts       # Localhost (192.168.1.100) filesystem
│   │   ├── gateway.ts         # Gateway (192.168.1.1) filesystem
│   │   ├── fileserver.ts      # Fileserver (192.168.1.50) filesystem
│   │   ├── webserver.ts       # Webserver (192.168.1.75) filesystem
│   │   ├── darknet.ts         # Darknet (203.0.113.42) filesystem
│   │   ├── shadow.ts          # Shadow (10.66.66.1) filesystem — Flag 14 debug challenge
│   │   ├── void.ts            # Void (10.66.66.2) filesystem — Flag 15 CSV extraction challenge
│   │   ├── abyss.ts           # Abyss (10.66.66.3) filesystem — Flag 16 XOR cipher challenge
│   │   └── index.ts           # Barrel re-exports
│   └── types.ts               # FileNode, FilePermissions, FileSystemPatch types
├── hooks/
│   ├── useCommandHistory.ts      # Up/down arrow command history
│   ├── useAutoComplete.ts        # Tab completion for commands and variables
│   ├── useVariables.ts           # const/let variable management
│   ├── useFileSystemCommands.ts  # pwd, ls, cd, cat, whoami, decrypt, nano command creation
│   ├── useNetworkCommands.ts     # ifconfig and network command creation
│   ├── useFtpCommands.ts         # FTP mode commands (pwd, ls, get, put, etc.)
│   └── useCommands.ts            # Command registry and execution context
├── network/
│   ├── NetworkContext.tsx     # Per-machine network state (session-aware)
│   ├── initialNetwork.ts      # Per-machine network configs (interfaces, machines, DNS)
│   ├── types.ts               # NetworkInterface, RemoteMachine, MachineNetworkConfig types
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
│   ├── nmap.ts             # nmap(target) - network scanning and port discovery
│   ├── nslookup.ts         # nslookup(domain) - DNS domain resolution
│   ├── ssh.ts              # ssh(user, host) - secure shell connection
│   ├── decrypt.ts          # decrypt(file, key) - decrypt file using AES-256-GCM
│   ├── output.ts           # output(cmd, [file]) - capture command output
│   ├── resolve.ts          # resolve(promise) - unwrap Promise value
│   ├── strings.ts          # strings(file) - extract printable strings from binary
│   ├── exit.ts             # exit() - close SSH connection and return
│   ├── curl.ts             # curl(url, [flags]) - HTTP client for GET/POST
│   ├── nano.ts             # nano(path) - open file in text editor overlay
│   ├── node.ts             # node(path) - execute JavaScript file
│   ├── reset.ts            # reset(["confirm"]) - reset game to factory defaults
│   ├── permissions.ts      # Command restrictions by user type (guest/user/root)
│   ├── ftp.ts              # ftp(host) - FTP connection command
│   ├── ftp/                # FTP mode commands
│   │   ├── pwd.ts          # pwd() - remote working directory
│   │   ├── lpwd.ts         # lpwd() - local working directory
│   │   ├── cd.ts           # cd(path) - change remote directory
│   │   ├── lcd.ts          # lcd(path) - change local directory
│   │   ├── ls.ts           # ls([path]) - list remote directory
│   │   ├── lls.ts          # lls([path]) - list local directory
│   │   ├── get.ts          # get(file, [dest]) - download file
│   │   ├── put.ts          # put(file, [dest]) - upload file
│   │   └── quit.ts         # quit()/bye() - close FTP connection
│   ├── ls.test.ts           # Tests colocated with ls.ts
│   ├── cd.test.ts           # Tests colocated with cd.ts
│   ├── cat.test.ts          # Tests colocated with cat.ts
│   ├── help.test.ts         # Tests colocated with help.ts
│   ├── man.test.ts          # Tests colocated with man.ts
│   ├── su.test.ts           # Tests colocated with su.ts
│   ├── ifconfig.test.ts     # Tests colocated with ifconfig.ts
│   ├── ping.test.ts         # Tests colocated with ping.ts
│   ├── nslookup.test.ts     # Tests colocated with nslookup.ts
│   ├── nmap.test.ts         # Tests colocated with nmap.ts
│   ├── ssh.test.ts          # Tests colocated with ssh.ts
│   ├── ftp.test.ts          # Tests colocated with ftp.ts
│   ├── nc.test.ts           # Tests colocated with nc.ts
│   ├── decrypt.test.ts      # Tests colocated with decrypt.ts
│   ├── output.test.ts       # Tests colocated with output.ts
│   ├── resolve.test.ts      # Tests colocated with resolve.ts
│   ├── strings.test.ts      # Tests colocated with strings.ts
│   ├── curl.test.ts         # Tests colocated with curl.ts
│   ├── nano.test.ts         # Tests colocated with nano.ts
│   ├── node.test.ts         # Tests colocated with node.ts
│   ├── reset.test.ts        # Tests colocated with reset.ts
│   └── permissions.test.ts  # Tests colocated with permissions.ts
├── filesystem/
│   └── machines/
│       ├── darknet.test.ts         # Tests for darknet filesystem content (Flag 13, etc.)
│       ├── shadow.test.ts         # Tests for shadow Flag 14 (script debugging logic)
│       ├── void.test.ts           # Tests for void Flag 15 (CSV data extraction logic)
│       └── abyss.test.ts         # Tests for abyss Flag 16 (XOR cipher decode logic)
├── utils/
│   ├── md5.ts              # MD5 hashing for password validation
│   ├── network.ts          # Network utilities (IP validation, range parsing)
│   ├── crypto.ts           # Crypto utilities (AES-256-GCM encrypt/decrypt, hex conversion)
│   ├── stringify.ts        # Value stringification (used by echo, output, resolve)
│   ├── storage.ts          # IndexedDB wrapper (open, read, write for session and filesystem stores)
│   └── storageCache.ts     # Pre-load cache: loads IndexedDB before React mounts, localStorage migration
├── test/
│   └── setup.ts            # Test setup with jest-dom and fake-indexeddb
├── App.tsx                 # Root component (wraps Terminal with providers)
│
public/
├── favicon.svg             # SVG favicon (terminal prompt icon)
├── apple-touch-icon.png    # iOS home screen icon (180x180)
├── og-image.png            # Open Graph social preview image (1200x630)
├── og-image.svg            # SVG version of OG image
├── og-image.html           # Source HTML for regenerating OG image PNG
├── robots.txt              # Search engine crawler rules
└── sitemap.xml             # Sitemap for search engines
│
e2e/
└── ctf-playthrough.spec.ts # Playwright E2E test (full 16-flag CTF playthrough)
│
playwright.config.ts        # Playwright config (Chromium only, 5min timeout, webServer auto-start)
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

### Command Restrictions by User Type

Commands are tiered by user type (`src/commands/permissions.ts`). Restricted commands show a `permission denied` error and are hidden from `help()` and tab autocomplete. `man()` can still look up any command.

| Tier     | User Type | Commands                                                                                                   |
| -------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| Basic    | `guest`   | help, man, echo, whoami, pwd, ls, cd, cat, su, clear, author                                               |
| Standard | `user`    | All basic + ifconfig, ping, nmap, nslookup, ssh, ftp, nc, curl, strings, output, resolve, exit, nano, node |
| Full     | `root`    | All standard + decrypt                                                                                     |

FTP and NC modes are not restricted (they have their own separate command sets).

### Adding New Commands

Commands are registered in `src/hooks/useCommands.ts`. Each command implements the `Command` type:

```typescript
type CommandManual = {
  readonly synopsis: string;
  readonly description: string;
  readonly arguments?: readonly CommandArgument[];
  readonly examples?: readonly CommandExample[];
};

type Command = {
  readonly name: string;
  readonly description: string;
  readonly manual?: CommandManual;
  readonly fn: (...args: unknown[]) => unknown;
};
```

To add a command:

1. Create a new file in `src/commands/` (e.g., `myCommand.ts`)
2. Export a `Command` object with `manual` field for documentation
3. Import and register it in `src/hooks/useCommands.ts` using `commands.set('name', myCommand)`

### Available Commands

| Command                | Description                                                                    |
| ---------------------- | ------------------------------------------------------------------------------ |
| `help()`               | Lists all available commands                                                   |
| `man(cmd)`             | Display detailed manual for a command                                          |
| `echo(value)`          | Outputs the stringified value                                                  |
| `author()`             | Displays author profile card with avatar and links                             |
| `clear()`              | Clears the terminal screen                                                     |
| `pwd()`                | Print current working directory                                                |
| `ls([path])`           | List directory contents                                                        |
| `cd([path])`           | Change current directory                                                       |
| `cat(path)`            | Display file contents                                                          |
| `decrypt(file, key)`   | Decrypt file using AES-256-GCM (async, key is 64-char hex)                     |
| `output(cmd, [file])`  | Capture command output to variable or file (sync/Promise)                      |
| `resolve(promise)`     | Unwrap a Promise and display its resolved value (async)                        |
| `strings(file, [min])` | Extract printable strings from binary files                                    |
| `su(user)`             | Switch user (prompts for password)                                             |
| `whoami()`             | Display current username                                                       |
| `ifconfig([iface])`    | Display network interface configuration                                        |
| `ping(host, [count])`  | Send ICMP echo request to network host (async, streams output)                 |
| `nmap(target)`         | Network exploration and port scanning (async, streams output)                  |
| `nslookup(domain)`     | Query DNS to resolve domain name to IP address (async)                         |
| `ssh(user, host)`      | Connect to remote machine via SSH (async, prompts for password)                |
| `exit()`               | Close SSH connection and return to previous machine                            |
| `ftp(host)`            | Connect to remote machine via FTP (async, prompts for username/password)       |
| `curl(url, [flags])`   | HTTP client - fetch web content with GET/POST (async, supports -i and -X POST) |
| `nano(path)`           | Open file in nano-style text editor overlay (Ctrl+S save, Ctrl+X exit)         |
| `node(path)`           | Execute a JavaScript file with access to all terminal commands                 |
| `reset(["confirm"])`   | Reset game to factory defaults (clears IndexedDB, reloads page)                |
| `nc(host, port)`       | Netcat - connect to arbitrary port (async, interactive for special services)   |

**FTP Mode Commands** (available only when connected via FTP):

| Command                        | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `pwd()`                        | Print remote working directory                       |
| `lpwd()`                       | Print local working directory                        |
| `cd(path)`                     | Change remote directory                              |
| `lcd(path)`                    | Change local directory                               |
| `ls([path], [flags])`          | List remote directory contents (-a for hidden files) |
| `lls([path], [flags])`         | List local directory contents (-a for hidden files)  |
| `get(remoteFile, [localPath])` | Download file from remote to local                   |
| `put(localFile, [remotePath])` | Upload file from local to remote                     |
| `quit()` / `bye()`             | Close FTP connection                                 |

**NC Mode Commands** (available when connected to interactive services via nc):

| Command               | Description                                   |
| --------------------- | --------------------------------------------- |
| `pwd()`               | Print working directory                       |
| `cd(path)`            | Change directory                              |
| `ls([path], [flags])` | List directory contents (-a for hidden files) |
| `cat(path)`           | Display file contents                         |
| `whoami()`            | Display current user                          |
| `help()`              | List available commands                       |
| `exit()`              | Close connection                              |

NC mode provides read-only shell access to the remote machine's filesystem. The user and permissions depend on who installed the service (e.g., `ghost` for the elite service on darknet port 31337).

### Virtual File System

The terminal includes a virtual Unix-like file system (`src/filesystem/`). Each machine (localhost and remote) has its own filesystem with unique content and users.

**Per-Machine Filesystems** (`machineFileSystems.ts`):

- `localhost` (192.168.1.100): jshacker, guest, root - starting machine
- `gateway` (192.168.1.1): admin - router with config backups, dual-interface (WAN + LAN)
- `fileserver` (192.168.1.50): ftpuser, root - FTP server with /srv/ftp
- `webserver` (192.168.1.75): www-data, root - web server with /var/www
- `darknet` (203.0.113.42): ghost, root - mysterious server with final flag + bonus ROT13 challenge, dual-interface (public + hidden 10.66.66.0/24)
- `shadow` (10.66.66.1): operator, root - monitoring node, Flag 14 debug challenge, FTP exports + diagnostics
- `void` (10.66.66.2): dbadmin, root - database node, Flag 15 CSV extraction challenge, maintenance port 9999
- `abyss` (10.66.66.3): phantom, root - deepest node, Flag 16 XOR cipher challenge, SSH only

**Common Directory Structure:**

```
/
├── root/           # Root user home (root only)
├── home/
│   └── [users]/    # Home directories for each user
├── etc/
│   ├── passwd      # User passwords (MD5 hashed)
│   ├── hostname    # Machine hostname
│   ├── hosts       # Host-to-IP mappings
│   └── [configs]   # Machine-specific configs (iptables, vsftpd, apache2, mysql)
├── var/
│   └── log/        # Log files (auth.log, syslog, firewall.log, mysql.log, etc.)
└── tmp/            # Temporary files (world writable)
```

Each machine also includes noise files (dotfiles, configs, logs, web assets, red herrings) alongside CTF flag/hint files to create a realistic Linux environment. Noise files never contain `FLAG{` patterns.

**Filesystem Factory** (`fileSystemFactory.ts`):

```typescript
const config: MachineFileSystemConfig = {
  users: [...],           // Users with password hashes
  rootContent: {...},     // Custom /root content
  varLogContent: {...},   // Log files with hints
  etcExtraContent: {...}, // Extra /etc files (hostname, hosts, configs)
  extraDirectories: {...} // Machine-specific directories
};
const fs = createFileSystem(config);
```

**Permission System:**

- Each file/directory has read/write/execute permissions per user type
- User types: `root`, `user`, `guest`
- Root has access to everything
- Regular users can access their home and shared directories
- Guests have limited access

**FileNode Structure:**

```typescript
type FileNode = {
  readonly name: string;
  readonly type: 'file' | 'directory';
  readonly owner: UserType;
  readonly permissions: {
    readonly read: readonly UserType[];
    readonly write: readonly UserType[];
    readonly execute: readonly UserType[];
  };
  readonly content?: string;
  readonly children?: Readonly<Record<string, FileNode>>;
};
```

**Filesystem Persistence (Patches):**

User-created and modified files are persisted to IndexedDB (`jshack-db` database, `filesystem` store, `patches` key) using a patches approach. Only the diff from the base filesystem is stored — not the full tree.

```typescript
type FileSystemPatch = {
  readonly machineId: string;
  readonly path: string; // absolute resolved path
  readonly content: string;
  readonly owner: UserType;
};
```

**How it works:**

- On every `writeFileToMachine` or `createFileOnMachine` call, a patch is recorded (upserted by machineId + path)
- Patches are saved to IndexedDB via `useEffect` whenever they change (fire-and-forget async)
- On initialization, `applyPatches()` replays patches on top of the base filesystem from `machineFileSystems`
- Existing files get their content updated; new files are created with `read/write/execute: ['root', owner]` permissions
- Base filesystem updates in code still take effect — patches layer on top
- Clearing the IndexedDB `jshack-db` database resets to factory state

**Write operations that trigger patches:**

- `output(cmd, filePath)` — captures command output to a file
- FTP `get(file)` — downloads file from remote to local machine
- FTP `put(file)` — uploads file from local to remote machine
- `nano(path)` — saves edited content via Ctrl+S in the editor overlay

### Nano Editor

The `nano(path)` command opens a full-screen nano-style text editor overlay (`NanoEditor.tsx`). It uses the `nano_open` special output type to signal Terminal.tsx to display the editor.

**How it works:**

1. `nano("file.js")` validates the path and returns `{ __type: 'nano_open', filePath }`.
2. Terminal.tsx detects the special type, reads file content (or empty for new files), and sets `editorState`.
3. `NanoEditor` renders as a fixed overlay covering the entire viewport with amber CRT styling.
4. On save (Ctrl+S), the editor calls `writeFile` (existing) or `createFile` (new) from FileSystemContext.
5. On exit (Ctrl+X/Escape), the editor calls `onClose` which clears `editorState`.

**Editor features:**

- **Ctrl+S** — Save file (creates or updates, shows line count in status bar)
- **Ctrl+X / Escape** — Exit (prompts Y/N/C if unsaved changes)
- **Tab** — Insert 2 spaces at cursor position
- **Status bar** — Shows cursor position (Ln/Col), save status, error messages
- **Modified indicator** — Shows "Modified" in header when content has changed

### Node Execution

The `node(path)` command reads a JavaScript file and executes its contents using `new Function()` with access to all terminal commands. It checks both read and execute permissions — a file can be readable (`cat`) but not executable (`node`) unless it has explicit execute permission. It uses a lazy getter pattern to resolve a circular dependency — node needs the execution context which includes node itself.

In `useCommands.ts`, a mutable `let resolvedExecutionContext` variable is set after building the full command map. Node's factory captures a getter `() => resolvedExecutionContext` which is only called at execution time (after the variable is populated).

**Execution strategy:** Tries as expression first (`return (content)`), falls back to statement execution. Expression mode returns the value; statement mode returns undefined.

### Network System

The terminal simulates a network environment for CTF puzzles (`src/network/`):

**Network Topology:**

The network is **per-machine** — each machine has its own interfaces, reachable machines, and DNS records. `NetworkContext` uses `session.machine` to resolve the active config.

```
198.51.100.0/24 (Internet)
│
├── 198.51.100.10 ─── gateway eth0 (WAN)
│                     gateway eth1 (LAN) ─── 192.168.1.1
│                                             │
│                                        192.168.1.0/24 (Local LAN)
│                                             ├── 192.168.1.50  fileserver
│                                             ├── 192.168.1.75  webserver
│                                             └── 192.168.1.100 localhost (player)
│
└── 203.0.113.42 ─── darknet eth0 (Public)
                      darknet eth1 ─── 10.66.66.100
                                        │
                                   10.66.66.0/24 (Hidden Network)
                                        ├── 10.66.66.1  shadow
                                        ├── 10.66.66.2  void
                                        └── 10.66.66.3  abyss
```

**Reachability rules:**

- LAN machines reach each other + darknet (via gateway NAT)
- Darknet sees ONLY gateway's WAN IP (198.51.100.10) + hidden network — cannot route to 192.168.1.x
- Hidden machines only reach each other + darknet's eth1 (10.66.66.100)

**DNS Records (per-machine):**

```
# LAN + Darknet DNS (available to localhost, gateway, fileserver, webserver)
gateway.local    -> 192.168.1.1
fileserver.local -> 192.168.1.50
webserver.local  -> 192.168.1.75
darknet.ctf      -> 203.0.113.42
www.darknet.ctf  -> 203.0.113.42

# Hidden DNS (available to darknet, shadow, void, abyss)
shadow.hidden    -> 10.66.66.1
void.hidden      -> 10.66.66.2
abyss.hidden     -> 10.66.66.3
```

**NetworkInterface Structure:**

```typescript
type NetworkInterface = {
  readonly name: string;
  readonly flags: readonly string[];
  readonly inet: string;
  readonly netmask: string;
  readonly gateway: string;
  readonly mac: string;
};
```

**RemoteMachine Structure:**

```typescript
type Port = {
  readonly port: number;
  readonly service: string;
  readonly open: boolean;
};

type RemoteUser = {
  readonly username: string;
  readonly passwordHash: string;
  readonly userType: 'root' | 'user' | 'guest';
};

type RemoteMachine = {
  readonly ip: string;
  readonly hostname: string;
  readonly ports: readonly Port[];
  readonly users: readonly RemoteUser[];
};
```

**DnsRecord Structure:**

```typescript
type DnsRecord = {
  readonly domain: string;
  readonly ip: string;
  readonly type: 'A';
};
```

**Per-Machine Network Config:**

```typescript
type MachineNetworkConfig = {
  readonly interfaces: readonly NetworkInterface[];
  readonly machines: readonly RemoteMachine[];
  readonly dnsRecords: readonly DnsRecord[];
};

type NetworkConfig = {
  readonly machineConfigs: Readonly<Record<string, MachineNetworkConfig>>;
};
```

`NetworkContext` imports `useSession` and resolves the active config per `session.machine`. All getter functions (`getInterfaces`, `getMachine`, `getLocalIP`, etc.) read from the resolved per-machine config — function signatures are unchanged.

**Usage in commands:**

```typescript
const { getInterfaces, getMachines, getGateway, resolveDomain } = useNetwork();
// These automatically return data for the current machine (session.machine)
const eth0 = getInterface('eth0');
// On localhost: eth0.inet = '192.168.1.100', eth0.gateway = '192.168.1.1'
// On darknet: eth0.inet = '203.0.113.42', eth0.gateway = '203.0.113.1'

const record = resolveDomain('darknet.ctf');
// record.ip = '203.0.113.42'
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
type AsyncOutput = {
  readonly __type: 'async';
  readonly start: (
    onLine: (line: string) => void,
    onComplete: (followUp?: SshPromptData) => void,
  ) => void;
  readonly cancel?: () => void;
};
```

The `onComplete` callback can optionally return a `SshPromptData` to trigger password prompt mode after the async phase (used by `ssh` command).

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
      timeoutIds.forEach((id) => clearTimeout(id));
    },
  };
};
```

**Commands using AsyncOutput:**

- `ping(host, [count])` - ~800ms delay between each ICMP response
- `nmap(target)` - Progressive scanning with ~150ms per IP (range) or ~300ms per port (single host)
- `nslookup(domain)` - ~600ms delay for DNS lookup
- `ssh(user, host)` - ~1.4s connection delay, then password prompt

### Session Context

Global state for terminal session managed via React Context (`src/session/SessionContext.tsx`). SessionContext is the **single source of truth** for all session state:

```typescript
type Session = {
  readonly username: string;
  readonly userType: UserType;
  readonly machine: string;
  readonly currentPath: string;
};
```

**Available methods:**

- `getPrompt()` - Returns formatted prompt (e.g., `jshacker@localhost>`)
- `setUsername(name, type)` - Change current user
- `setMachine(name)` - Change current machine
- `setCurrentPath(path)` - Change current working directory
- `pushSession()` - Save current session to stack (used before SSH)
- `popSession()` - Restore previous session from stack (used by exit command)
- `canReturn()` - Check if session stack has entries

**Session Stack:**
When SSH-ing to a remote machine, the current session is saved to a stack. The `exit()` command pops from this stack to restore the previous session state (user, machine, working directory).

**Session Persistence:**
Session state is automatically persisted to IndexedDB (`jshack-db` database, `session` store, `state` key):

- Persisted on every state change (fire-and-forget async write)
- Pre-loaded from IndexedDB before React mounts via `storageCache.ts`
- Validates data with type guards before restoring
- Falls back to defaults if invalid/corrupted
- One-time auto-migration from localStorage on first run after upgrade

Persisted data includes:

- `session`: machine, username, userType, currentPath
- `sessionStack`: SSH history for `exit()` to work across page reloads
- `ftpSession`: FTP mode state (if active)

**Filesystem Persistence:**
File changes (creates/writes) are separately persisted to IndexedDB (`filesystem` store, `patches` key) as patches. See the "Filesystem Persistence (Patches)" section under Virtual File System for details.

**Persistence Architecture:**

The persistence layer consists of three modules:

1. **`src/utils/storage.ts`** — Low-level IndexedDB wrapper. Handles database creation (`jshack-db`, version 1), typed read/write operations for `session` and `filesystem` stores. All operations are Promise-based with try/catch error handling.

2. **`src/utils/storageCache.ts`** — Pre-load cache that bridges async IndexedDB with synchronous React `useState` initializers. `initializeStorage()` is called in `main.tsx` before `createRoot().render()`, loading both stores into a module-level cache. Contexts read from this cache during initialization. Also handles one-time migration from localStorage keys (`jshack-session`, `jshack-filesystem`).

3. **Contexts** — `SessionContext` and `FileSystemContext` read initial state from the cache (synchronous), and write updates to IndexedDB via `useEffect` (async, fire-and-forget).

```
main.tsx: await initializeStorage()  →  IndexedDB → module cache
                                                        ↓
SessionContext:    useState(getCachedSessionState)       (sync read)
FileSystemContext: useState(getCachedFilesystemPatches)  (sync read)
                                                        ↓
useEffect:         saveSessionState(db, state)           (async write)
useEffect:         saveFilesystemPatches(db, patches)    (async write)
```

**Usage in commands:**

```typescript
const { setUsername, setMachine, setCurrentPath, pushSession, popSession } = useSession();
pushSession(); // Save before SSH (reads current state automatically)
setUsername('admin', 'user');
setMachine('192.168.1.1');
setCurrentPath('/home/admin');
// Later: popSession() restores previous state
```

## Styling

- **Theme**: Retro amber-on-black (CRT monitor aesthetic)
- **Colors**: `text-amber-400`/`text-amber-500` for text, `bg-black` background, `text-red-500` for errors
- **Font**: Monospace (`font-mono`)
- **Layout**: Full viewport height, flex column with scrollable output area

## SEO & Open Graph

The site includes full SEO and social sharing optimization:

**Static assets** (`public/`):

- `robots.txt` — Allows all crawlers, references sitemap
- `sitemap.xml` — Single URL entry for the SPA
- `og-image.png` — 1200x630 social preview image (CRT terminal aesthetic)
- `og-image.svg` — SVG version of the OG image
- `og-image.html` — Source HTML for regenerating the PNG (open in browser, screenshot)
- `apple-touch-icon.png` — 180x180 iOS home screen icon

**Meta tags** (`index.html`):

- SEO: description, keywords, author, theme-color, canonical URL
- Open Graph: og:title, og:description, og:image (1200x630), og:url, og:type, og:site_name
- Twitter Card: summary_large_image with title, description, image
- Icons: SVG favicon + Apple touch icon

**Regenerating the OG image:**

1. Edit `public/og-image.html` to change the design
2. Open in a browser at 1200x630 viewport
3. Screenshot to `public/og-image.png` (or use Playwright: `npx playwright screenshot --viewport-size="1200,630" --full-page "file:///path/to/og-image.html" "og-image.png"`)

## Code Formatting

The project uses **Prettier** for consistent code formatting. Configuration is in `.prettierrc`:

- Single quotes, semicolons, trailing commas (`all`)
- 2-space indentation, 100 character print width
- LF line endings, arrow function parens always
- `.prettierignore` excludes `dist/`, `coverage/`, `node_modules/`, and binary files

**ESLint integration**: `eslint-config-prettier` is included as the last config entry in `eslint.config.js` to disable any ESLint rules that conflict with Prettier. ESLint handles code quality, Prettier handles formatting.

```bash
npm run format        # Format all files in place
npm run format:check  # Check formatting without modifying (useful for CI)
```

## Deployment

The project is configured for Vercel deployment. Push to `main` branch triggers automatic deployment.
