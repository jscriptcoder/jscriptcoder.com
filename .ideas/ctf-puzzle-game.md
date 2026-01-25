# CTF Puzzle Game - Brainstorming

A Capture The Flag style hacking simulation for the JscriptCoder terminal.

## Core Concept

Turn the terminal into an interactive hacking simulation game where players must escalate privileges and explore a virtual file system to find hidden flags.

---

## Permission System

| User Type | Home Directory | Can Read | Can Write | Commands |
|-----------|---------------|----------|-----------|----------|
| `guest` | `/home/guest` | Own dir only | Own dir only | Basic: `ls`, `cd`, `cat`, `echo`, `help` |
| `user` | `/home/jscriptcoder` | Own + guest | Own + guest | + `nano`, `find`, `grep`, `chmod` |
| `root` | `/root` | Everything | Everything | + `su`, `passwd`, `shadow`, `ssh` |

---

## Directory Structure

```
/
├── root/
│   ├── .secret/
│   │   └── flag.txt          # "Congratulations! You've captured the flag!"
│   └── notes.txt             # Hints about the system
├── home/
│   ├── jscriptcoder/
│   │   ├── .bash_history     # Clue: failed password attempts?
│   │   ├── documents/
│   │   └── scripts/
│   └── guest/
│       ├── welcome.txt
│       └── readme.txt        # Starting hints
├── etc/
│   ├── passwd                # Readable - shows users exist
│   └── shadow                # Root only - hashed passwords
├── var/
│   └── log/
│       └── auth.log          # Login attempts, clues
└── tmp/                      # World-writable
```

---

## Puzzle Ideas for Localhost

### Level 1: Guest → User

**Goal:** Gain access to the `jscriptcoder` user account

**Possible solutions:**
- Find password hint in `/home/guest/readme.txt`
- Discover weak password through `.bash_history` clues
- Social engineering clue in `welcome.txt` mentioning a pet name or birthday

### Level 2: User → Root

**Goal:** Escalate to root privileges

**Possible solutions:**
- Find a script with SUID bit set that can be exploited
- Discover root password hint in an old backup file
- Exploit a misconfigured `sudo` permission
- Find credentials in a config file the user can read

---

## Commands to Implement

### Basic (all users)
```
ls(path?)        // List directory
cd(path)         // Change directory
cat(file)        // Read file
pwd()            // Print working directory
whoami()         // Current user
clear()          // Clear terminal
```

### User level
```
find(pattern)    // Search files
grep(pattern, file)  // Search in files
nano(file)       // Edit files (within permission)
chmod(perms, file)   // Change permissions (own files)
```

### Root level
```
su(user)         // Switch user (needs password)
passwd(user)     // Change password
ssh(user@host)   // Connect to remote machine (future)
```

### Game-specific
```
hint()           // Get a subtle hint (costs points?)
score()          // Show current progress
submit(flag)     // Validate a captured flag
```

---

## Game Mechanics

### State Tracking

```typescript
interface GameState {
  currentUser: 'guest' | 'user' | 'root';
  currentMachine: string;
  currentDirectory: string;
  unlockedFlags: string[];
  hintsUsed: number;
  commandsExecuted: number;
}
```

### Flag System
- Each level has a hidden flag
- Flags are text strings that prove you solved the puzzle
- `submit(flag)` command validates and records progress

### Hints System
- `hint()` command gives progressively more specific hints
- Optional: Penalty for using hints (lower score)

---

## Future: Network Expansion

```
localhost (10.0.0.1)
    │
    ├── webserver (10.0.0.2)     # SQL injection puzzle?
    │
    ├── fileserver (10.0.0.3)   # Find credentials in shared files
    │
    └── mainframe (10.0.0.99)   # Final boss - multiple steps
```

### Network Commands
```
ping(host)       // Check if host is alive
nmap(host)       // Discover open ports
ssh(user@host)   // Connect to remote machine
scp(file, dest)  // Copy files between machines
```

---

## Story/Theme Ideas

1. **Corporate Espionage**: You're a security researcher testing a company's defenses
2. **Mystery**: Someone left you a message in the root directory - who and why?
3. **Time Pressure**: A countdown adds urgency (optional)
4. **Breadcrumbs**: Each flag reveals part of a larger story

---

## Implementation Phases

### Phase 1: Foundation
- Virtual file system simulation
- Basic commands (`ls`, `cd`, `cat`, `pwd`, `whoami`)
- Permission system enforcement

### Phase 2: First Puzzle
- Guest → User → Root escalation on localhost
- Hint system
- Flag validation

### Phase 3: Network
- Multiple machines simulation
- `ssh` command to switch machines
- Network discovery commands

### Phase 4: Advanced
- More complex puzzles
- Story elements and narrative
- Scoring and leaderboard (optional)

---

## Technical Considerations

### File System Storage
- Could use a JSON structure to represent the virtual file system
- Store in React state or context
- Persist progress in localStorage

### Example File System Structure
```typescript
interface FileNode {
  name: string;
  type: 'file' | 'directory';
  permissions: {
    read: UserType[];
    write: UserType[];
    execute: UserType[];
  };
  owner: UserType;
  content?: string;          // For files
  children?: FileNode[];     // For directories
}
```

### Session Context Extensions
```typescript
interface Session {
  username: string;
  userType: UserType;
  machine: string;
  currentDirectory: string;  // Add this
  gameState: GameState;      // Add this
}
```
