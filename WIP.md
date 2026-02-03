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
- [x] Step 14: Unit test coverage (121 tests)
- [ ] Step 12: Victory tracking ← next
- [ ] Step 13: Challenge variety

## Recent Session (2026-02-03)

Implemented:
- **exit() command**: Return from SSH sessions with session stack
  - Added `SessionSnapshot` type and `sessionStack` to SessionContext
  - `pushSession()` saves state before SSH, `popSession()` restores on exit
  - Fixed SSH to properly use `switchMachine()` for filesystem switching
- **ftp() command**: Full FTP protocol simulation with dual-filesystem support
  - FTP mode with dedicated `ftp>` prompt and command set
  - 11 FTP commands: pwd, lpwd, cd, lcd, ls, lls, get, put, quit, bye
  - Cross-machine filesystem operations without switching active filesystem
  - Two-phase authentication (username then password)
  - `get(file, [dest])` downloads from remote to local
  - `put(file, [dest])` uploads from local to remote
- **TerminalInput refactor**: Combined `passwordMode` and `hidePrompt` into single `promptMode` prop
- **Test count**: Now 121 tests (was 103)

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

### Known Passwords (MD5 hashed)
- ftpuser@fileserver: password
- root@darknet: password
- ghost@darknet: fun123
- www-data@webserver: webmaster
- admin@gateway: admin
- root@localhost: toor
- jshacker@localhost: hackme

### Test Coverage
- 103 tests across 4 test files
- All commands with logic are tested
- Async commands tested with fake timers
