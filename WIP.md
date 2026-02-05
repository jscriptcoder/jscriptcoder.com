# WIP: JSHACK.ME CTF Terminal Game

## Current Step

Step 12 of 14: Victory tracking

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
- [x] Step 11: Additional exploitation commands (exit, ftp)
- [x] Step 14: Unit test coverage (424 tests, colocated)
- [ ] Step 12: Victory tracking ← next
- [ ] Step 13: Challenge variety

## Recent Session (2026-02-05)

Implemented:
- **Dynamic nc owner**: nc command no longer hardcodes "ghost" user
  - Added `ServiceOwner` type with username, userType, homePath
  - Extended `Port` type with optional `owner` field
  - nc command reads context from `port.owner` instead of hardcoding
  - Added backdoor on webserver port 4444 (www-data user)
  - Banner now shows actual port number (e.g., `# 4444 #`)
- **Fixed nc commands**: Corrected `resolvePath` signature in cd, ls, cat
- **NC command tests**: cat (11), cd (13), ls (14)
- **Test count**: Now 424 tests across 28 colocated files

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

Victory tracking:
- Track which flags have been found
- Display progress (e.g., "3/5 flags found")
- Victory screen when all flags collected

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
- 424 tests across 28 colocated test files
- All commands with logic are tested
- FTP subcommands tested (cd, lcd, ls, lls, get, put)
- NC subcommands tested (cat, cd, ls)
- Async commands tested with fake timers
- React hooks tested with React Testing Library (useCommandHistory, useVariables, useAutoComplete)
- React components tested with React Testing Library (TerminalOutput, TerminalInput)
