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
- [ ] Hidden flags throughout the system and network
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

### Step 8: Place flags in file system
**Test**: Flags exist in restricted files, accessible only with correct permissions
**Implementation**: Add FLAG{...} strings to files in /root, remote machines, etc.
**Done when**: At least 5 flags hidden with varying difficulty

### Step 9: Add hints and breadcrumbs
**Test**: Clues lead players toward flags without giving away solutions
**Implementation**: Add log files, config files, notes with subtle hints
**Done when**: Each flag has at least one discoverable hint

### Step 10: Remote machine file systems
**Test**: Each remote machine has its own file system when connected via SSH
**Implementation**: Create per-machine file systems with unique content
**Done when**: SSH to different machines shows different files

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
