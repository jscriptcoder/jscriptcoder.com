# WIP: JSHACK.ME CTF Terminal Game

## Current Step

Step 13 of 14: Victory tracking

## Status

⏸️ WAITING - Ready to start next feature

## Completed

- [x] Step 1: Core terminal with JavaScript execution
- [x] Step 2: Virtual file system with permissions
- [x] Step 3: File system commands (pwd, ls, cd, cat)
- [x] Step 4: User authentication (su with MD5 hashing)
- [x] Step 5: Network infrastructure (interfaces, machines, DNS)
- [x] Step 6: Network commands (ifconfig, ping, nmap, nslookup)
- [x] Step 7: Remote access (ssh command)
- [x] Step 8: Place flags in file system
- [x] Step 9: Add hints and breadcrumbs
- [x] Step 10: Remote machine file systems
- [x] Step 11: Additional exploitation commands (exit, ftp, nc)
- [x] Step 12: Session persistence (IndexedDB, migrated from localStorage)
- [ ] Step 13: Victory tracking ← next
- [ ] Step 14: Challenge variety

## Recent Session (2026-02-12)

Implemented:

- **nano command**: Full-screen nano-style text editor overlay for creating/editing files
  - `nano(path)` validates path, returns `nano_open` special output type
  - `NanoEditor.tsx` component: fixed overlay, amber CRT aesthetic, textarea-based editing
  - Ctrl+S save, Ctrl+X/Escape exit, Tab inserts 2 spaces, cursor position tracking
  - Exit prompt (Y/N/C) when unsaved changes exist
  - Calls `writeFile`/`createFile` from FileSystemContext — changes persist to IndexedDB
  - 9 tests for nano command, 17 tests for NanoEditor component
- **node command**: Execute JavaScript files with access to all terminal commands
  - `node(path)` reads file content and evaluates via `new Function()` with full command context
  - Lazy getter pattern resolves circular dependency (node needs execution context that includes node)
  - Tries expression mode first, falls back to statement execution
  - 12 tests covering execution, context access, and error handling
- **Execute permission**: Added Unix-like execute permission to filesystem
  - `FilePermissions` now has `execute` field alongside `read` and `write`
  - Directories: `execute` matches `read`. Scripts/binaries: `execute` matches `read`. Data files: `execute: ['root']`
  - Only `node()` checks execute permission — `cat`, `ls`, `cd` etc. unchanged
  - User-created files (nano, output, ftp get/put): `execute: ['root', owner]`
  - 4 new tests in node.test.ts for execute permission behavior
- **Permission tiers**: Both nano and node added to user-tier (same as strings, output, etc.)
- **Test count**: 674 tests across 41 colocated files

## Previous Session (2026-02-10)

Implemented:

- **Prettier code formatter**: Set up Prettier for consistent code formatting across the project
  - Installed `prettier` and `eslint-config-prettier`
  - Created `.prettierrc` matching existing code style (single quotes, semicolons, trailing commas, 2-space indent, 100 char width)
  - Created `.prettierignore` for dist/coverage/node_modules/binary files
  - Added `eslint-config-prettier` as last entry in `eslint.config.js` (disables conflicting ESLint rules)
  - Added `npm run format` and `npm run format:check` scripts
  - Formatted entire codebase — all 632 tests pass, build succeeds
- **SEO & Open Graph**: Full search engine optimization and social sharing support
  - Added `robots.txt` and `sitemap.xml` for search engine crawlers
  - Created OG image (1200x630) with CRT terminal aesthetic — ASCII banner, nmap scan, amber glow
  - Generated `og-image.png` via Playwright screenshot of `og-image.html` template
  - Created `apple-touch-icon.png` (180x180) for iOS home screen
  - Added comprehensive meta tags to `index.html`: SEO (description, keywords, author, theme-color, canonical), Open Graph (title, description, image, url, type, site_name), Twitter Card (summary_large_image)
- **IndexedDB migration**: Migrated all persistence from localStorage to IndexedDB
  - Created `src/utils/storage.ts` — IndexedDB wrapper with typed read/write for `session` and `filesystem` stores
  - Created `src/utils/storageCache.ts` — Pre-load cache: loads IndexedDB before React mounts (async→sync bridge)
  - Updated `src/main.tsx` — Async startup: `await initializeStorage()` before `createRoot().render()`
  - Updated `SessionContext.tsx` and `FileSystemContext.tsx` — Replaced localStorage with cache reads and IndexedDB writes
  - One-time auto-migration from localStorage keys (`jshack-session`, `jshack-filesystem`) for returning users
  - Added `fake-indexeddb` dev dependency for test environment polyfill
  - 28 new tests (14 for storage wrapper, 14 for cache/migration)
- **Test count**: 632 tests across 38 colocated files (before nano/node)

## Session (2026-02-09)

Implemented:

- **CTF redesign Phase 1-5**: Complete flag system overhaul
  - Phase 1: Command restrictions by user type (guest/user/root tiers)
  - Phase 2: 12 flag files, encrypted files (AES-256-GCM), binary for strings, hint files
  - Phase 3: Web content for all machines (gateway, webserver, darknet)
  - Phase 4: Playtest, fix FTP/NC ls hidden file consistency, update docs
  - Phase 5: Filesystem noise for realism (configs, logs, dotfiles, red herrings across all 5 machines)
- **Filesystem noise**: Added ~35 noise files across all machines
  - /etc files: hostname, hosts, crontab, iptables.rules, vsftpd.conf, apache2.conf, my.cnf
  - Home dotfiles: .bash_history, .bashrc on localhost; .bash_history on gateway guest, darknet ghost/root
  - Logs: syslog, firewall.log, mysql.log, cron.log
  - Web assets: robots.txt, .htaccess, style.css on gateway and webserver
  - Red herrings: nmap_cheatsheet.txt, todo.txt, meeting_notes, tmp_data.csv, backup_manifest.txt
  - Darknet flavor: ghost tools/ with port_scanner.py, /etc/hosts with .onion entries
- **FTP/NC ls hidden file support**: Added `-a` flag to show dotfiles (consistent with regular ls)
- **Test count**: 604 tests across 36 colocated files (before IndexedDB migration)

## Previous Session (2026-02-08)

Implemented:

- **Command restrictions by user type** (`src/commands/permissions.ts`):
  - Guest: basic navigation only (ls, cd, cat, su, help, man, echo, whoami, pwd, clear, author)
  - User: all basic + network/analysis tools (nmap, ssh, ftp, nc, curl, ifconfig, ping, nslookup, strings, output, resolve, exit)
  - Root: all user + decrypt
  - Restricted commands wrapped with permission-checking fn (clear "permission denied" error)
  - `help()` and tab autocomplete filter out restricted commands
  - `man()` can still look up any command (for learning)
  - Privileges update instantly on `su()` via `session.userType` in `useMemo` deps
  - FTP/NC modes unaffected (separate command sets)
  - 21 tests for permissions module
- **CTF flag redesign plan** (`CTF_DESIGN.md`): 12-flag progression, command tiers, escalation paths
- **Test count**: 604 tests across 36 colocated files

Previous session (2026-02-08):

- **curl command**: HTTP client for fetching web content from remote machines
  - `curl(url)` - GET request, serves from `/var/www/html/` on target machine
  - `curl(url, "-X POST")` - POST request, reads from `/var/www/api/{endpoint}.json`
  - `curl(url, "-i")` - include HTTP response headers (Server, Content-Type, custom)
  - Per-machine server config (Apache/nginx, custom headers like X-Powered-By)
  - DNS resolution via existing `resolveDomain()`
  - Port validation: must be open HTTP/HTTPS/HTTP-ALT service
  - AsyncOutput with 400-600ms delay for realism
  - 27 tests covering errors, GET, POST, headers, DNS, async, cancellation
- **Web content added to machine filesystems**:
  - Gateway: `/var/www/html/index.html` (router page), `admin.html` (root-only, has flag)
  - Webserver: `/var/www/api/users.json`, `config.json` (DB creds + flag)
  - Darknet: `/var/www/html/index.html` (ASCII art), `/var/www/api/secrets.json` (encoded hint + flag)
- **New flags**: FLAG{router_admin_panel}, FLAG{api_config_exposed}, FLAG{darknet_api_discovered}
- **Test count**: 572 tests across 35 colocated files

## Session (2026-02-07)

Implemented:

- **Filesystem persistence**: User-created/modified files now survive page refresh
  - Patches approach: only the diff from base filesystem is stored in localStorage (`jshack-filesystem`)
  - `FileSystemPatch` type: machineId, path, content, owner
  - Patches upserted (deduped by machineId + path) on every `writeFileToMachine`/`createFileOnMachine`
  - `applyPatches()` replays patches on top of base filesystem at init
  - Covers `output(cmd, file)`, FTP `get`/`put`, and any future write operations
  - Clear `jshack-filesystem` from localStorage to reset to factory state
- **output command**: Capture command output to variable or file
  - `output(cmd)` - returns string for sync, Promise for async
  - `output(cmd, filePath)` - writes output to file
  - 16 tests covering sync/async capture and file writing
- **resolve command**: Unwrap Promises and display resolved value
  - Shows "Resolving..." then displays the value
  - Handles both resolved values and rejections
  - 14 tests covering all scenarios
- **stringify utility**: Extracted shared stringification logic
  - Used by echo, output, and resolve commands
  - 12 tests for stringify, removed echo tests (trivial wrapper)
- **ping fix**: Only respond to known machines, 100% packet loss for unknown IPs
- **strings command**: Extract printable strings from binary files
  - `strings(file, [minLength])` - extracts ASCII sequences (4+ chars default)
  - Added binary file detection to `cat` - shows warning for binary files
  - Added `/bin/sudo` binary on webserver with hidden FLAG
- **Test count**: 545 tests across 34 colocated files (before curl)

## Session (2026-02-06)

Implemented:

- **decrypt command**: Decrypt files using Web Crypto API (AES-256-GCM)
  - Takes file path and 64-character hex key (256 bits)
  - Returns AsyncOutput with "Decrypting..." progress
  - Validates key format (hex, correct length)
  - Handles permission checks and file validation
  - 17 tests covering all edge cases
- **Crypto utilities** (`src/utils/crypto.ts`):
  - `hexToBytes()`, `bytesToHex()` - hex/binary conversion
  - `generateKey()` - random 256-bit key generation
  - `encryptContent()`, `decryptContent()` - AES-256-GCM operations
- **Test encrypted files**: Added to localhost `/home/jshacker/`:
  - `secret.enc` - encrypted file with test flag
  - `keyfile.txt` - decryption key for testing
- **Test count**: 469 tests across 30 colocated files

## Session (2026-02-05)

Implemented:

- **Dynamic nc owner**: nc command no longer hardcodes "ghost" user
  - Added `ServiceOwner` type with username, userType, homePath
  - Extended `Port` type with optional `owner` field
  - nc command reads context from `port.owner` instead of hardcoding
  - Added backdoor on webserver port 4444 (www-data user)
  - Banner now shows actual port number (e.g., `# 4444 #`)
- **Fixed nc commands**: Corrected `resolvePath` signature in cd, ls, cat
- **NC command tests**: nc (28), cat (11), cd (13), ls (14)
- **Test count**: Now 452 tests across 29 colocated files

## Session (2026-02-04)

Implemented:

- **nc (netcat) command**: Connect to arbitrary ports on remote machines
  - Shows service banners for common ports (ssh, http, ftp, mysql)
  - Interactive mode for special services (port 31337 on darknet)
  - Runs as configured user with real filesystem access (read-only)
  - Commands: pwd, cd, ls, cat, whoami, help, exit
  - Minimal `$` prompt - players must discover context with whoami/pwd
  - Service named "elite" (not "backdoor") to be less obvious
- **State consolidation**: Moved `currentPath` from FileSystemContext to SessionContext
  - SessionContext is now single source of truth for: machine, username, userType, currentPath
  - FileSystemContext reads location from SessionContext (no more duplication)
  - Removed `switchMachine()` - session state changes handle machine switching
  - `pushSession()` no longer takes parameter (reads from session)
  - `popSession()` fully restores all state including currentPath
- **Session persistence**: localStorage saves/restores session state
  - Persists: session (machine, user, path), sessionStack (SSH history), ftpSession, ncSession
  - Validates persisted data with type guards before restoring
  - Fallback to defaults if localStorage is empty/invalid/corrupted
  - Auto-saves on every state change
- **Component tests**: TerminalOutput (19 tests), TerminalInput (26 tests)
- **FTP command tests**: cd (15), lcd (15), ls (12), lls (12), get (13), put (13)
- **Test count**: 386 tests across 25 colocated files

## Blockers

None currently.

## Next Action

Victory tracking (Step 13):

### Flag Detection

- Detect flags automatically when user runs `cat` on a file containing `FLAG{...}` pattern
- Intercept output in Terminal component and scan for flag patterns
- Mark flag as found without requiring special command

### Storage

- Store found flags in IndexedDB (similar to session/filesystem persistence)
- Track: list of found flags, timestamp when each was discovered
- Type: `FlagState = { foundFlags: string[], firstFoundAt: Record<string, number> }`

### Presentation

- **On discovery**: Show notification banner when a new flag is captured
  ```
  ╔═══════════════════════════════════════╗
  ║  FLAG CAPTURED: welcome_hacker        ║
  ║  Progress: 3/12 flags found           ║
  ╚═══════════════════════════════════════╝
  ```
- **flags() command**: Check progress anytime, shows found flags and progress (3/12)
- **Victory screen**: ASCII art celebration when all 12 flags found, with stats (time, flags)

### Flags to Track (12 total)

1. `FLAG{welcome_hacker}` - localhost (ls, cat)
2. `FLAG{hidden_in_plain_sight}` - localhost (ls -a, cat)
3. `FLAG{root_access_granted}` - localhost (crack passwd, su root)
4. `FLAG{network_explorer}` - gateway (ifconfig, nmap, curl)
5. `FLAG{gateway_breach}` - gateway (ssh guest, su admin)
6. `FLAG{admin_panel_exposed}` - gateway (cat/curl admin.html)
7. `FLAG{file_transfer_pro}` - fileserver (ftp, ls -a, get)
8. `FLAG{binary_secrets_revealed}` - webserver (ssh, su, strings)
9. `FLAG{decrypted_intel}` - cross-machine (decrypt with split key)
10. `FLAG{backdoor_found}` - webserver (nc port 4444)
11. `FLAG{darknet_discovered}` - darknet (nslookup, curl :8080)
12. `FLAG{master_of_the_darknet}` - darknet (ssh, su root, decrypt)

---

## Challenge Variety (Step 14)

### Alternative Flag Discovery Methods

Beyond `cat`, flags can be discovered through various commands:

#### curl Command

HTTP requests to web servers for clues and flags:

**GET requests:**

```javascript
curl('http://192.168.1.75/robots.txt'); // Reveals hidden paths
curl('http://192.168.1.75/.git/config'); // Exposed git config
curl('http://192.168.1.75/admin/backup'); // Returns a flag
```

**POST requests:**

```javascript
curl('http://192.168.1.75/api/login', { method: 'POST', body: { user: 'admin', pass: 'admin' } });
// Returns: { "token": "FLAG{...}" }
```

**Scenarios:**

- Query web server, find hints in HTML comments
- Discover API endpoints from config files, then query them
- POST credentials found in log files to get access tokens

#### Other Potential Commands

| Command                        | Use Case                           |
| ------------------------------ | ---------------------------------- |
| `grep("FLAG", "/var")`         | Search files for patterns          |
| `strings("binary.dat")`        | Extract text from "binary" files   |
| `base64("-d", "RkxBR3suLi59")` | Decode obfuscated content          |
| `env()`                        | Environment variables with secrets |
| `mysql("SELECT * FROM users")` | SQL queries on webserver           |

#### Multi-Step Discovery Chains

Example puzzle requiring multiple steps:

1. `cat /var/log/auth.log` → reveals a username
2. `curl http://webserver/~username/` → finds a config file path
3. `cat` the config → contains base64-encoded flag
4. `base64 -d` → reveals the flag

#### Encrypted File Challenge (Web Crypto API)

Use the Web Crypto API (AES-GCM) for encryption puzzles:

**decrypt command:**

```javascript
decrypt(file, key); // Decrypt a file using AES-256-GCM
```

**Example puzzle:**

```javascript
// 1. Player finds an encrypted file
cat('/home/ghost/secret.enc');
// Output: "U2FsdGVkX1..." (base64 encrypted data)

// 2. Player finds a key elsewhere (in logs, config, etc.)
cat('/var/log/keyfile');
// Output: "aes-key: 7f3d8a..."

// 3. Player decrypts the file
decrypt('secret.enc', '7f3d8a...');
// Output: "FLAG{crypto_master}"
```

**Implementation notes:**

- Use `crypto.subtle.decrypt()` with AES-GCM
- Keys found in various locations (log files, env vars, API responses)
- Encrypted files contain base64-encoded ciphertext
- Wrong key → "Decryption failed" error

#### Hash Verification Challenge (Web Crypto API)

Use `crypto.subtle.digest()` to verify file integrity - detect backdoored binaries:

**checksum command:**

```javascript
checksum(file); // Calculate SHA-256 hash of a file
```

**Example puzzle:**

```javascript
// 1. Find a list of known good hashes
cat('/etc/checksums');
// Output:
// /bin/sudo: sha256:5e884898da28047d...
// /bin/login: sha256:a3f8c2e1b9d04567...

// 2. Check if system binaries have been tampered with
checksum('/bin/sudo');
// Output: "sha256:9f86d081884c7d65..." (different!)

// 3. The tampered binary contains a clue or backdoor
strings('/bin/sudo');
// Output: "BACKDOOR_PASSWORD=FLAG{binary_tampering}"
```

**Implementation notes:**

- Use `crypto.subtle.digest('SHA-256', data)`
- Compare hashes to detect modifications
- Tampered files reveal clues about attacker activity

#### HMAC API Authentication Challenge (Web Crypto API)

Use `crypto.subtle.sign()` with HMAC for API request signing:

**hmac command:**

```javascript
hmac(message, key); // Generate HMAC-SHA256 signature
```

**Example puzzle:**

```javascript
// 1. Find API documentation mentioning HMAC auth
cat('/var/www/api/README');
// Output: "All requests must include X-Signature header with HMAC-SHA256"

// 2. Find the secret key
cat('/etc/api/.secret');
// Output: "hmac-secret: a3f8c2e1b9d0..."

// 3. Craft a signed request
curl('http://192.168.1.75/api/admin', {
  headers: { 'X-Signature': hmac('GET /api/admin', 'a3f8c2e1b9d0...') },
});
// Output: { "flag": "FLAG{api_signature_master}" }
```

**Implementation notes:**

- Use `crypto.subtle.sign('HMAC', key, data)`
- Unsigned or incorrectly signed requests → "401 Unauthorized"
- Teaches real-world API security concepts

#### Flag Detection Points

Flags should be detected from output of:

- `cat` - reading files
- `curl` - HTTP responses (body, headers)
- `grep` - search results
- `strings` - extracted text from binaries
- `base64` - decoded content
- `decrypt` - decrypted content (Web Crypto API)
- `checksum` - hash verification may reveal tampered files with clues
- `mysql` - query results
- Any command that outputs text containing `FLAG{...}` pattern

---

## Infrastructure Ready

### Machines with Per-Machine Filesystems

| Machine    | IP            | Users                 | Flags                                                                           |
| ---------- | ------------- | --------------------- | ------------------------------------------------------------------------------- |
| localhost  | 192.168.1.100 | jshacker, root, guest | FLAG{welcome_to_the_underground}                                                |
| gateway    | 192.168.1.1   | admin, guest          | FLAG{router_misconfiguration}, FLAG{router_admin_panel}                         |
| fileserver | 192.168.1.50  | root, ftpuser, guest  | FLAG{ftp_hidden_treasure}                                                       |
| webserver  | 192.168.1.75  | root, www-data, guest | FLAG{sql_history_exposed}, FLAG{database_backup_gold}, FLAG{api_config_exposed} |
| darknet    | 203.0.113.42  | root, ghost, guest    | FLAG{master_of_the_darknet}, FLAG{darknet_api_discovered}                       |

### Backdoors (nc interactive mode)

| Machine   | Port  | Service | User     | Home Path   |
| --------- | ----- | ------- | -------- | ----------- |
| webserver | 4444  | elite   | www-data | /var/www    |
| darknet   | 31337 | elite   | ghost    | /home/ghost |

### Known Passwords (MD5 hashed)

- root@localhost: sup3rus3r
- jshacker@localhost: h4ckth3pl4n3t
- guest@localhost: guestpass
- admin@gateway: n3tgu4rd!
- guest@gateway: guest2024
- root@fileserver: b4ckup2024
- ftpuser@fileserver: tr4nsf3r
- guest@fileserver: anonymous
- root@webserver: r00tW3b!
- www-data@webserver: d3v0ps2024
- guest@webserver: w3lcome
- root@darknet: d4rkn3tR00t
- ghost@darknet: sp3ctr3
- guest@darknet: sh4d0w

### Test Coverage

- 674 tests across 41 colocated test files
- All commands with logic are tested
- FTP subcommands tested (cd, lcd, ls, lls, get, put)
- NC command and subcommands tested (nc, cat, cd, ls)
- Curl command tested (27 tests: errors, GET, POST, headers, DNS, async)
- Decrypt command tested (17 tests)
- Output command tested (16 tests)
- Resolve command tested (14 tests)
- Nano command tested (9 tests: existing/new files, permissions, errors)
- Node command tested (16 tests: execution, context access, execute permission, errors)
- NanoEditor component tested (17 tests: rendering, save, exit flow, modified indicator)
- Async commands tested with fake timers
- React hooks tested with React Testing Library (useCommandHistory, useVariables, useAutoComplete)
- React components tested with React Testing Library (TerminalOutput, TerminalInput, NanoEditor)
