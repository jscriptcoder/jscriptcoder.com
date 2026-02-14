# CLAUDE.md

## Project Overview

**JSHACK.ME** is a web-based JavaScript terminal emulator with a retro amber-on-black CRT aesthetic. Features a virtual filesystem with Unix-like permissions for CTF-style hacking puzzles (16 flags). Deployed on Vercel at jshack.me.

## Code Style

**IMPORTANT:** Follow these skills — they are the source of truth for code patterns:

- **Functional programming**: @.claude/skills/functional/SKILL.md
- **TypeScript strict**: @.claude/skills/typescript-strict/SKILL.md

Key rules (see skills for full details):

- `type` over `interface`, `readonly` everywhere, no `any`, no `as Type`
- Immutable data: spread operators, `slice()`, `map()`, `filter()` — never mutate
- Pure functions, early returns, max 2 levels nesting, no comments explaining code

## Build & Development Commands

```bash
npm run dev           # Start Vite dev server (auto-runs encode first)
npm run build         # TypeScript compile + Vite production build (auto-runs encode first)
npm run encode        # Generate encoded filesystem (src/filesystem/machines/__encoded.ts)
npm run lint          # Run ESLint
npm run format        # Format all files with Prettier
npm run format:check  # Check formatting without modifying (CI-friendly)
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage
npm run test:e2e      # Run Playwright E2E test (full CTF playthrough)
```

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool and dev server
- **Tailwind CSS v4** — Styling (via `@tailwindcss/vite` plugin)
- **Prettier** — Code formatting (single quotes, semicolons, trailing commas, 100 char width)
- **Vitest** + **React Testing Library** — Unit testing
- **Playwright** — E2E testing (Chromium, full CTF playthrough)

## Key Architecture

Detailed architecture: @.claude/docs/architecture.md
CTF design (network, machines, filesystems): @.claude/docs/ctf-design.md

### Command Execution Flow

User input flows through `Terminal.tsx`:
1. Checked for variable operations (`const`/`let`) via `useVariables` hook
2. Otherwise executed as command via `new Function()` with commands/variables injected into scope

### Adding New Commands

1. Create file in `src/commands/` exporting a `Command` object (see `src/components/Terminal/types.ts` for type)
2. Register in `src/hooks/useCommands.ts` via `commands.set('name', myCommand)`
3. Add permission tier in `src/commands/permissions.ts` (guest/user/root)

### Command Restrictions

Commands are tiered by user type (`src/commands/permissions.ts`):
- **guest**: help, man, echo, whoami, pwd, ls, cd, cat, su, clear, author
- **user**: All guest + ifconfig, ping, nmap, nslookup, ssh, ftp, nc, curl, strings, output, resolve, exit, nano, node
- **root**: All user + decrypt

### Content Encoding (Anti-Cheat)

Filesystem content is XOR+Base64 encoded at build time to prevent finding `FLAG{` in the JS bundle.
- `npm run encode` generates `src/filesystem/machines/__encoded.ts` (gitignored)
- `predev`/`prebuild` hooks auto-run encode
- `machineFileSystems.ts` imports from `__encoded.ts`, not source machine files
- Unit tests import machine files directly (unaffected by encoding)
- Verify: `grep -r "FLAG{" dist/` after build should return zero matches

### Special Output Types

Commands return objects with `__type` for custom rendering (see `src/components/Terminal/types.ts`):
- `'clear'`, `'author'`, `'password_prompt'`, `'nano_open'`, `'async'`
- `AsyncOutput` streams lines with delays for network commands (ping, nmap, ssh, nslookup)

### Persistence

Session and filesystem state persist to IndexedDB (`jshack-db` database):
- `storageCache.ts` pre-loads data before React mounts (sync cache for `useState` initializers)
- `SessionContext` and `FileSystemContext` write updates via `useEffect` (async, fire-and-forget)
- Filesystem uses a patches approach — only diffs from base filesystem are stored
- `reset("confirm")` clears IndexedDB and reloads to factory state

### Node Execution Circular Dependency

`node(path)` needs the execution context which includes `node` itself. Resolved via a lazy getter pattern: mutable `let resolvedExecutionContext` in `useCommands.ts` is set after building the full command map, and node's factory captures a getter that's only called at execution time.

## Styling

- **Theme**: Retro amber-on-black CRT aesthetic
- **Colors**: `text-amber-400`/`text-amber-500` text, `bg-black` background, `text-red-500` errors
- **Font**: Monospace (`font-mono`), full viewport height

## Deployment

Vercel deployment. Push to `main` triggers automatic deploy.
