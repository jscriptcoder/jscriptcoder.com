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
- [x] Step 12: Session persistence (localStorage)
- [ ] Step 13: Victory tracking ← next
- [ ] Step 14: Challenge variety

## Recent Session (2026-02-05)

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

## Previous Session (2026-02-04)

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
- Store found flags in localStorage (similar to session persistence)
- Track: list of found flags, timestamp when each was discovered
- Type: `FlagState = { foundFlags: string[], firstFoundAt: Record<string, number> }`

### Presentation
- **On discovery**: Show notification banner when a new flag is captured
  ```
  ╔═══════════════════════════════════════╗
  ║  FLAG CAPTURED: welcome_to_the_underground  ║
  ║  Progress: 3/6 flags found            ║
  ╚═══════════════════════════════════════╝
  ```
- **flags() command**: Check progress anytime, shows found flags and progress (3/6)
- **Victory screen**: ASCII art celebration when all 6 flags found, with stats (time, flags)

### Flags to Track (6 total)
1. `FLAG{welcome_to_the_underground}` - localhost
2. `FLAG{router_misconfiguration}` - gateway
3. `FLAG{ftp_hidden_treasure}` - fileserver
4. `FLAG{sql_history_exposed}` - webserver
5. `FLAG{database_backup_gold}` - webserver
6. `FLAG{master_of_the_darknet}` - darknet

---

## Challenge Variety (Step 14)

### Alternative Flag Discovery Methods

Beyond `cat`, flags can be discovered through various commands:

#### curl Command
HTTP requests to web servers for clues and flags:

**GET requests:**
```javascript
curl("http://192.168.1.75/robots.txt")     // Reveals hidden paths
curl("http://192.168.1.75/.git/config")    // Exposed git config
curl("http://192.168.1.75/admin/backup")   // Returns a flag
```

**POST requests:**
```javascript
curl("http://192.168.1.75/api/login", { method: "POST", body: { user: "admin", pass: "admin" } })
// Returns: { "token": "FLAG{...}" }
```

**Scenarios:**
- Query web server, find hints in HTML comments
- Discover API endpoints from config files, then query them
- POST credentials found in log files to get access tokens

#### Other Potential Commands

| Command | Use Case |
|---------|----------|
| `grep("FLAG", "/var")` | Search files for patterns |
| `strings("binary.dat")` | Extract text from "binary" files |
| `base64("-d", "RkxBR3suLi59")` | Decode obfuscated content |
| `env()` | Environment variables with secrets |
| `mysql("SELECT * FROM users")` | SQL queries on webserver |

#### Multi-Step Discovery Chains

Example puzzle requiring multiple steps:
1. `cat /var/log/auth.log` → reveals a username
2. `curl http://webserver/~username/` → finds a config file path
3. `cat` the config → contains base64-encoded flag
4. `base64 -d` → reveals the flag

#### Flag Detection Points

Flags should be detected from output of:
- `cat` - reading files
- `curl` - HTTP responses (body, headers)
- `grep` - search results
- `strings` - extracted text
- `base64` - decoded content
- `mysql` - query results
- Any command that outputs text containing `FLAG{...}` pattern

---

## Infrastructure Ready

### Machines with Per-Machine Filesystems

| Machine | IP | Users | Flags |
|---------|-----|-------|-------|
| localhost | 192.168.1.100 | jshacker, root, guest | FLAG{welcome_to_the_underground} |
| gateway | 192.168.1.1 | admin, guest | FLAG{router_misconfiguration} |
| fileserver | 192.168.1.50 | root, ftpuser, guest | FLAG{ftp_hidden_treasure} |
| webserver | 192.168.1.75 | root, www-data, guest | FLAG{sql_history_exposed}, FLAG{database_backup_gold} |
| darknet | 203.0.113.42 | root, ghost, guest | FLAG{master_of_the_darknet} |

### Backdoors (nc interactive mode)

| Machine | Port | Service | User | Home Path |
|---------|------|---------|------|-----------|
| webserver | 4444 | elite | www-data | /var/www |
| darknet | 31337 | elite | ghost | /home/ghost |

### Known Passwords (MD5 hashed)
- ftpuser@fileserver: password
- root@darknet: password
- ghost@darknet: fun123
- www-data@webserver: webmaster
- admin@gateway: admin
- root@localhost: toor
- jshacker@localhost: hackme

### Test Coverage
- 452 tests across 29 colocated test files
- All commands with logic are tested
- FTP subcommands tested (cd, lcd, ls, lls, get, put)
- NC command and subcommands tested (nc, cat, cd, ls)
- Async commands tested with fake timers
- React hooks tested with React Testing Library (useCommandHistory, useVariables, useAutoComplete)
- React components tested with React Testing Library (TerminalOutput, TerminalInput)
