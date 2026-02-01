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

## Future Ideas: Alternative Connection Methods

### FTP Command
Connect to machines with FTP service (port 21). Limited commands within FTP session:
- `ftp_ls()` - List remote directory
- `ftp_cd(path)` - Change remote directory
- `ftp_get(file)` - Download file to local /tmp
- `ftp_put(file)` - Upload file to remote (if writable)
- `ftp_quit()` - Exit FTP session

**Use case**: fileserver (192.168.1.50) has FTP open. Players can explore /srv/ftp anonymously or with ftpuser credentials to find hidden files.

### Telnet Command
For machines with SSH closed but telnet open (port 23). Less secure, used on legacy/misconfigured systems.
- `telnet(host)` - Connect to telnet service
- Would enter a limited shell like FTP

**Use case**: Add a legacy machine with telnet only, no SSH. Forces players to use older protocol.

### Netcat (nc) Command
Swiss army knife for network connections. Connect to arbitrary ports, useful for:
- Backdoor connections on unusual ports
- Banner grabbing
- Connecting to services without dedicated clients

```javascript
nc("192.168.1.75", 8080)  // Connect to hidden service
nc("-l", 4444)            // Listen mode (for reverse shells)
```

**Use case**: webserver has a hidden backdoor on port 8080 that nc can connect to.

### curl Command
HTTP client for web exploitation:
- `curl(url)` - Fetch URL content
- `curl("-X", "POST", url, data)` - POST requests
- `curl("-d", "cmd=ls", url)` - Form data

**Use cases**:
- Fetch robots.txt revealing hidden paths
- Exploit command injection in web apps
- Access admin panels with default credentials
- Download sensitive files via path traversal

### mysql Command
Database client for machines with MySQL (port 3306):
- `mysql("-u", "user", "-p", "password", "host")` - Connect
- Would enter SQL prompt mode with limited commands

**Use case**: webserver has MySQL. Players find DB credentials in config.php, connect to dump user tables with password hashes.

### Limited Shell Concept
When connected via non-SSH methods (ftp, telnet, nc), players get a restricted environment:
- Different prompt (e.g., `ftp>`, `telnet>`, `$`)
- Only method-appropriate commands available
- Can't access local filesystem
- `exit` or `quit` returns to normal terminal

### Attack Path Examples

**fileserver via FTP:**
1. `nmap("192.168.1.50")` - Find FTP open
2. `ftp("192.168.1.50")` - Connect anonymously
3. `ftp_cd(".hidden")` - Find hidden directory
4. `ftp_get("backup.tar.gz")` - Download to /tmp
5. Back in local shell, `cat("/tmp/backup.tar.gz")` - Find flag

**webserver via curl + mysql:**
1. `curl("http://192.168.1.75/robots.txt")` - Find /admin
2. `curl("http://192.168.1.75/admin/config.php.bak")` - Get DB creds
3. `mysql("-u", "admin", "-p", "db_pass_123", "192.168.1.75")` - Connect
4. `SELECT * FROM users;` - Find password hashes
5. Crack hash, SSH in as admin

**gateway via telnet:**
1. `nmap("192.168.1.1")` - SSH closed, telnet open
2. `telnet("192.168.1.1")` - Connect with default admin:admin
3. Navigate to /var/log to find hints about other machines

**darknet via nc backdoor:**
1. `nmap("203.0.113.42")` - Find unusual port 31337 open
2. `nc("203.0.113.42", 31337)` - Connect to backdoor
3. Limited shell access, find breadcrumbs to real credentials
