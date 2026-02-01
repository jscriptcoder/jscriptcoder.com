# Plan: JSHACK.ME CTF Terminal Game

## Goal

Build a web-based CTF (Capture The Flag) hacking game where players use a JavaScript terminal to explore a virtual file system, escalate privileges, and hack into remote machines to find hidden flags.

## Acceptance Criteria

- [x] Terminal with JavaScript execution and custom commands
- [x] Virtual Unix-like file system with permissions
- [x] User authentication system (su command with password hashing)
- [x] Network simulation with multiple machines
- [x] Network reconnaissance commands (ifconfig, ping, nmap, nslookup)
- [x] Remote machine access (ssh command)
- [x] Per-machine file systems with unique content
- [x] Hidden flags throughout the system and network
- [x] Unit tests for commands (103 tests)
- [ ] Multiple difficulty levels of challenges
- [ ] Victory condition when all flags are found

## Completed Steps

### Step 1: Core terminal with JavaScript execution
**Done**: Terminal component with input/output, command history, tab autocompletion

### Step 2: Virtual file system
**Done**: Unix-like directory structure with read/write/execute permissions per user type

### Step 3: File system commands
**Done**: pwd, ls, cd, cat commands with permission checking

### Step 4: User authentication
**Done**: su command with MD5 password hashing, /etc/passwd file

### Step 5: Network infrastructure
**Done**: NetworkContext with interfaces, remote machines, DNS records

### Step 6: Network commands
**Done**: ifconfig, ping (async), nmap (async), nslookup (async)

### Step 7: Remote access
**Done**: ssh command with async connection, password authentication, session switching

## Remaining Steps

### Step 8: Place flags in file system ✅
**Done**: Flags placed in each machine's filesystem via machineFileSystems.ts
- localhost: FLAG{welcome_to_the_underground} in /root/.secret
- gateway: FLAG{router_misconfiguration} in /root/.router_backup
- fileserver: FLAG{ftp_hidden_treasure} in /srv/ftp/uploads/.hidden_backup.tar.gz
- webserver: FLAG{sql_history_exposed} in /root/.mysql_history, FLAG{database_backup_gold} in /var/www/backups/db_backup.sql
- darknet: FLAG{master_of_the_darknet} in /root/FINAL_FLAG.txt

### Step 9: Add hints and breadcrumbs ✅
**Done**: Log files and config files with hints in each machine
- gateway: /var/log/auth.log with SSH attempts
- fileserver: /var/log/vsftpd.log, /root/.bash_history with commands
- webserver: /var/log/access.log, /var/log/error.log, /var/www/html/config.php with DB creds
- darknet: /var/log/messages with base64 encoded messages, /home/ghost/.secrets/hint.txt

### Step 10: Remote machine file systems ✅
**Done**: Each machine has unique filesystem via createFileSystem() factory
- FileSystemContext.switchMachine(machineId, username) swaps filesystem
- machineFileSystems.ts defines all machine configurations
- su command uses dynamic getUsers() for current machine

### Step 11: Additional exploitation commands
**Test**: Commands like grep, find, strings work for discovering content
**Implementation**: Add utility commands useful for CTF challenges
**Done when**: Players have tools to search and analyze

### Step 12: Victory tracking
**Test**: Game tracks found flags and shows progress
**Implementation**: Flag submission system, progress indicator
**Done when**: Players know how many flags remain

### Step 13: Challenge variety
**Test**: Different types of challenges beyond password cracking
**Implementation**: Encoded data, hidden files, service exploitation
**Done when**: At least 3 distinct challenge types

### Step 14: Unit test coverage
**Done**: 103 tests across 4 test files
- file-system-commands.test.ts: ls, cd, cat (32 tests)
- utility-commands.test.ts: echo, help, man (30 tests)
- session-commands.test.ts: su (9 tests)
- network-commands.test.ts: ifconfig, ping, nslookup, nmap (50 tests)
