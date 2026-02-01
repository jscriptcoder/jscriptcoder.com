# WIP: JSHACK.ME CTF Terminal Game

## Current Step

Step 11 of 14: Additional exploitation commands

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
- [x] Step 14: Unit test coverage (103 tests)
- [ ] Step 11: Additional exploitation commands ← next
- [ ] Step 12: Victory tracking
- [ ] Step 13: Challenge variety

## Recent Session (2026-02-01)

Implemented:
- **Unit tests for commands** (103 tests total):
  - file-system-commands.test.ts: ls, cd, cat (32 tests)
  - utility-commands.test.ts: echo, help, man (30 tests)
  - session-commands.test.ts: su (9 tests)
  - network-commands.test.ts: ifconfig, ping, nslookup, nmap (50 tests)
- **Refactored su command**: Changed to `createSuCommand(context)` with dynamic `getUsers()` for per-machine users
- **Per-machine filesystem support**:
  - Created `fileSystemFactory.ts` with `createFileSystem()` factory
  - Created `machineFileSystems.ts` with configs for all 5 machines
  - Each machine has unique users, files, flags, and log hints
  - Updated `FileSystemContext` with `switchMachine(machineId, username)`
  - Removed `initialFileSystem.ts` (replaced by machineFileSystems)

## Blockers

None currently.

## Next Action

Wire up SSH to actually switch filesystems:
- Call `switchMachine()` in ssh command after successful authentication
- Test SSH workflow end-to-end with filesystem switch

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
