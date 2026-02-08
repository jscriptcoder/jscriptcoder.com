# CTF Flag Redesign

Complete redesign of the flag system for JSHACK.ME — a cohesive CTF experience where each flag teaches a skill, hints at the next challenge, and requires progressively advanced techniques.

---

## Design Principles

1. **Every command matters** — Each available command should be needed at some point during the CTF
2. **Natural progression** — Each flag hints at the next, creating a guided but not hand-held experience
3. **Skill building** — Early flags teach commands used in later, harder challenges
4. **Multiple connection methods** — Players must use SSH, FTP, NC, and curl at different stages
5. **Escalation paths** — Guest → user → root progression on machines
6. **Multi-step puzzles** — Advanced flags require combining variables, decrypt, strings, output

---

## Command Restrictions by User Type

**New feature**: Commands are tiered by user type. When a player connects to a machine as guest, they only have basic navigation. Escalating to user or root unlocks more powerful tools.

| Tier | User Type | Commands |
|------|-----------|----------|
| **Basic** | `guest` | help, man, echo, whoami, pwd, ls, cd, cat, su, clear, author |
| **Standard** | `user` | All basic + ifconfig, ping, nmap, nslookup, ssh, ftp, nc, curl, strings, output, resolve, exit |
| **Full** | `root` | All standard + decrypt |

**Rationale**:
- **Guests** can only look around and escalate (su) — they're intruders with minimal tools
- **Users** have network and analysis tools — they can explore, connect, and inspect
- **Root** has decrypt — the most powerful tool, requiring full access to use
- `su` is available to guests so they can escalate
- `exit` is available to users (need it to leave SSH sessions)

**When a restricted command is called**: Show an error like `permission denied: 'nmap' requires user privileges` — this teaches the player they need to escalate.

---

## `/etc/passwd` Permissions

| Machine | Readable by | Rationale |
|---------|------------|-----------|
| **localhost** | root, user | Player starts as user; can read passwd to learn the mechanic |
| **All remotes** | root only | Forces players to find credentials through other means (logs, configs, web pages) |

On remote machines, players must discover credentials through:
- Log files that leak usernames/passwords
- Config files with hardcoded credentials
- Web pages that expose user info
- Hints from other machines

---

## Network Topology (Unchanged)

```
192.168.1.0/24 (Local Network)
├── 192.168.1.1   gateway     — Router, HTTP/HTTPS open
├── 192.168.1.50  fileserver  — FTP and SSH open
├── 192.168.1.75  webserver   — SSH, HTTP, MySQL, backdoor:4444
├── 192.168.1.100 localhost   — Player's machine
└── 203.0.113.42  darknet     — SSH, HTTP-ALT:8080, backdoor:31337
```

---

## Machine Users

| Machine | Username | Type | Password | How player discovers password |
|---------|----------|------|----------|-------------------------------|
| **localhost** | jshacker | user | hackme | Player starts as this user |
| **localhost** | root | root | toor | Crack from /etc/passwd (readable) |
| **localhost** | guest | guest | guest1 | Not needed |
| **gateway** | guest | guest | guest | Hinted in localhost log files |
| **gateway** | admin | root | admin | Found in gateway config/log file (readable by guest) |
| **fileserver** | guest | guest | guest | Hinted on gateway web page |
| **fileserver** | ftpuser | user | password | Found in fileserver log or hint file |
| **fileserver** | root | root | root | Crack from /etc/passwd (after su to root) |
| **webserver** | guest | guest | guest | Found via curl or fileserver clue |
| **webserver** | www-data | user | webmaster | Found in web config or log file |
| **webserver** | root | root | root | Crack from /etc/passwd (after su to root) |
| **darknet** | guest | guest | guest | Found via webserver backdoor clue |
| **darknet** | ghost | user | fun123 | Found via darknet web page or API |
| **darknet** | root | root | password | Requires decrypting a file |

---

## Flag Progression

### Overview

| # | Flag | Machine | Difficulty | Key Skills |
|---|------|---------|------------|------------|
| 1 | FLAG{welcome_hacker} | localhost | Beginner | ls, cat |
| 2 | FLAG{hidden_in_plain_sight} | localhost | Beginner | ls (with -a flag) |
| 3 | FLAG{root_access_granted} | localhost | Beginner | cat /etc/passwd, su |
| 4 | FLAG{network_explorer} | network | Intermediate | ifconfig, ping, nmap, curl |
| 5 | FLAG{gateway_breach} | gateway | Intermediate | ssh (as guest), su, cat |
| 6 | FLAG{admin_panel_exposed} | gateway | Intermediate | curl (with -i), cat |
| 7 | FLAG{file_transfer_pro} | fileserver | Intermediate | ftp, get, ls |
| 8 | FLAG{binary_secrets_revealed} | webserver | Advanced | ssh, strings, output, variables |
| 9 | FLAG{decrypted_intel} | cross-machine | Advanced | decrypt, variables (key from #8) |
| 10 | FLAG{backdoor_found} | webserver | Advanced | nmap, nc |
| 11 | FLAG{darknet_discovered} | darknet | Expert | nslookup, curl |
| 12 | FLAG{master_of_the_darknet} | darknet | Expert | ssh/nc, su, decrypt (multi-step) |

---

### Detailed Flag Walkthrough

#### FLAG 1: `FLAG{welcome_hacker}` — First Steps
**Machine**: localhost | **Difficulty**: Beginner | **User**: jshacker (user)

**Skills taught**: `ls`, `cat` — basic file navigation

**Setup**:
- File: `/home/jshacker/README.txt`
- Permissions: readable by user

**Content**:
```
=== WELCOME TO JSHACK.ME ===

You are jshacker, a security researcher.
Your mission: investigate this network and uncover its secrets.

Start by exploring. Use ls() to list files, cd() to move around,
and cat() to read files.

FLAG{welcome_hacker}

Hint: Real hackers know that not all files are visible...
Try ls(".", "-a") to see hidden files.
```

**Leads to**: Flag 2 (hidden files)

---

#### FLAG 2: `FLAG{hidden_in_plain_sight}` — Hidden Files
**Machine**: localhost | **Difficulty**: Beginner | **User**: jshacker (user)

**Skills taught**: `ls` with `-a` flag — discovering hidden files

**Setup**:
- File: `/home/jshacker/.mission`
- Permissions: readable by user

**Content**:
```
MISSION BRIEFING
================
This network has been compromised. Multiple machines are running
suspicious services. Your job is to investigate.

FLAG{hidden_in_plain_sight}

NEXT STEPS:
1. Check /etc/passwd to see who else is on this machine
2. The root account holds secrets. Can you crack the password?
   Hint: Use su("root") after figuring out the password.
```

**Leads to**: Flag 3 (root escalation)

---

#### FLAG 3: `FLAG{root_access_granted}` — Root Access
**Machine**: localhost | **Difficulty**: Beginner | **User**: jshacker → root

**Skills taught**: Reading `/etc/passwd`, cracking MD5 hashes, `su`

**Setup**:
- `/etc/passwd` is readable by user on localhost (contains MD5 hashes)
- Root password `toor` has MD5 hash — player must recognize/crack it
- File: `/root/flag.txt` — readable only by root

**How to solve**:
1. `cat("/etc/passwd")` — see root's MD5 hash
2. Recognize the hash or crack it (common password "toor")
3. `su("root")` → enter password "toor"
4. `cat("/root/flag.txt")`

**Content** of `/root/flag.txt`:
```
FLAG{root_access_granted}

Now you have full control of this machine.
Try exploring the network:
  ifconfig() — see your network interface
  ping("192.168.1.1") — test connectivity
  nmap("192.168.1.0/24") — scan for machines
```

**Leads to**: Flag 4 (network discovery)

---

#### FLAG 4: `FLAG{network_explorer}` — Network Recon
**Machine**: network/gateway | **Difficulty**: Intermediate | **User**: jshacker (user) or root

**Skills taught**: `ifconfig`, `ping`, `nmap`, `curl`

**Setup**:
- Gateway web page (`/var/www/html/index.html`) contains the flag
- Accessible via `curl("192.168.1.1")`

**How to solve**:
1. `ifconfig()` — see IP 192.168.1.100, gateway 192.168.1.1
2. `ping("192.168.1.1")` — gateway responds
3. `nmap("192.168.1.0/24")` — discover all machines and open ports
4. Notice gateway has port 80 (http) open
5. `curl("192.168.1.1")` — get the web page

**Content** of gateway `/var/www/html/index.html`:
```html
<h1>NetGuard Router v3.2.1</h1>
<p>Administration portal</p>
<p>Authorized personnel only.</p>
<!-- FLAG{network_explorer} -->
<!-- Admin panel: /admin.html (restricted) -->
<!-- Default credentials may still be in the system logs -->
```

**Leads to**: Flag 5 (gateway SSH) — hint about credentials in logs

**Also needed**: A hint on localhost about the gateway guest password. Add to `/var/log/auth.log` on localhost:
```
[info] Auto-configured gateway access: guest/guest (default credentials)
```

---

#### FLAG 5: `FLAG{gateway_breach}` — Gateway Breach
**Machine**: gateway | **Difficulty**: Intermediate | **User**: guest → admin (root)

**Skills taught**: `ssh` as guest, navigating with limited commands, `su` escalation

**Setup**:
- SSH into gateway as guest (password: "guest", hinted in localhost logs)
- As guest: only basic commands (ls, cd, cat, su, etc.)
- A world-readable config or log file leaks admin credentials
- File: `/var/log/auth.log` on gateway — readable by guest
- Flag: `/root/flag.txt` — readable only by root

**How to solve**:
1. `ssh("guest", "192.168.1.1")` → password "guest"
2. As guest, explore: `ls("/var/log")`, `cat("/var/log/auth.log")`
3. Log contains: `[warning] Failed login attempt for admin with password 'admin' from 192.168.1.100`
4. `su("admin")` → password "admin"
5. `cat("/root/flag.txt")`

**Content** of gateway `/root/flag.txt`:
```
FLAG{gateway_breach}

The admin panel at /var/www/html/admin.html contains
network configuration details. Check it out.

Also noticed unusual FTP traffic to 192.168.1.50.
Credentials might be the defaults: guest/guest
```

**Leads to**: Flag 6 (admin panel) + Flag 7 (fileserver)

---

#### FLAG 6: `FLAG{admin_panel_exposed}` — Admin Panel
**Machine**: gateway | **Difficulty**: Intermediate | **User**: admin (root) on gateway

**Skills taught**: `curl` with `-i` flag, or reading files as root

**Setup**:
- File: `/var/www/html/admin.html` — readable only by root
- Accessible via `cat` as root on gateway, or `curl("192.168.1.1/admin.html", "-i")` from localhost as root

**Content** of `/var/www/html/admin.html`:
```html
<h1>NetGuard Admin Panel</h1>
<h2>Network Configuration</h2>
<table>
  <tr><td>Gateway</td><td>192.168.1.1</td></tr>
  <tr><td>File Server</td><td>192.168.1.50</td></tr>
  <tr><td>Web Server</td><td>192.168.1.75</td></tr>
  <tr><td>External</td><td>203.0.113.42 (darknet.ctf)</td></tr>
</table>
<!-- FLAG{admin_panel_exposed} -->
<!-- Maintenance note: webserver guest account uses default password -->
```

**Leads to**: Flag 7 (fileserver) — confirms network layout and darknet existence

---

#### FLAG 7: `FLAG{file_transfer_pro}` — File Transfer
**Machine**: fileserver | **Difficulty**: Intermediate | **User**: guest → ftpuser (user)

**Skills taught**: `ftp`, FTP commands (ls, cd, get), file transfer workflow

**Setup**:
- FTP into fileserver as guest (password: "guest", hinted in gateway flag)
- As guest on FTP: can list and navigate
- Find hint about ftpuser in a readable directory
- Download a file containing the flag

**How to solve**:
1. `ftp("192.168.1.50")` → username "guest", password "guest"
2. FTP mode: `ls()` → see `/srv/ftp` contents
3. `cd("uploads")` → `ls()` → find files
4. Find a readable file with a hint: `cat` a public notice file that mentions ftpuser
5. `quit()` → `ftp("192.168.1.50")` as ftpuser/password
6. `ls("uploads")` → find `.backup_notes.txt` (hidden file)
7. `get(".backup_notes.txt")`

**Content** of `.backup_notes.txt`:
```
Backup rotation schedule — DO NOT SHARE

FLAG{file_transfer_pro}

Note: Encrypted backup stored on webserver at /var/www/backups/
Encryption key was split — part 1 is in the webserver binary at /opt/tools/scanner
The key file will be needed for decryption.

Webserver SSH accepts default guest credentials.
```

**Leads to**: Flag 8 (binary analysis on webserver) + Flag 9 (decryption)

---

#### FLAG 8: `FLAG{binary_secrets_revealed}` — Binary Analysis
**Machine**: webserver | **Difficulty**: Advanced | **User**: guest → www-data (user)

**Skills taught**: `strings`, `output`, variables (`const`/`let`)

**Setup**:
- SSH into webserver as guest (password: "guest", hinted in admin panel + backup notes)
- As guest: limited commands, can navigate but not use `strings`
- Need to escalate to user (www-data) to use `strings`
- A readable log hints at www-data credentials
- Binary at `/opt/tools/scanner` — readable by user
- Binary contains flag + half of a decryption key

**How to solve**:
1. `ssh("guest", "192.168.1.75")` → password "guest"
2. As guest, explore: `cat("/var/log/access.log")` (readable by guest)
3. Log contains: `[auth] www-data authenticated from console (webmaster)`
4. `su("www-data")` → password "webmaster"
5. Now has user commands: `strings("/opt/tools/scanner")`
6. Output includes flag and key fragment
7. `const scannerOutput = output(strings, "/opt/tools/scanner")` — store result

**Content** embedded in binary (visible via strings):
```
FLAG{binary_secrets_revealed}
DECRYPT_KEY_PART1=a1b2c3d4e5f6
See /var/www/backups/ for the encrypted file.
The second half of the key is in /srv/ftp/config/ on the fileserver.
```

**Leads to**: Flag 9 (decryption) — player now has half a key and knows where to look

---

#### FLAG 9: `FLAG{decrypted_intel}` — Decryption Challenge
**Machine**: cross-machine | **Difficulty**: Advanced | **User**: root (for decrypt command)

**Skills taught**: `decrypt`, variables, cross-machine problem solving, `resolve`

**Setup**:
- Encrypted file on webserver: `/var/www/backups/encrypted_intel.enc` (readable by user)
- Key part 1: from binary analysis (Flag 8)
- Key part 2: on fileserver `/srv/ftp/config/.key_fragment` (readable by user via FTP)
- Full key: concatenation of both parts (64-char hex string)
- `decrypt` requires root — player must be root on current machine

**How to solve**:
1. Get key part 2 from fileserver via FTP: `get(".key_fragment")`
2. Read the key fragment: `cat(".key_fragment")` → `DECRYPT_KEY_PART2=7890abcdef01`
3. Combine: `const key = "a1b2c3d4e5f67890abcdef01..."` (64 hex chars)
4. Get the encrypted file (already on webserver, or FTP get it)
5. Must be root to use decrypt: `su("root")` on localhost (already know password "toor")
6. `resolve(decrypt("/path/to/encrypted_intel.enc", key))`

**Decrypted content**:
```
FLAG{decrypted_intel}

INTELLIGENCE REPORT:
The webserver at 192.168.1.75 has a backdoor running on port 4444.
It was installed by www-data. Use nc to connect.

There's also an external server at darknet.ctf (203.0.113.42).
Use nslookup("darknet.ctf") to verify.
Its web service runs on port 8080.
```

**Leads to**: Flag 10 (backdoor) + Flag 11 (darknet)

---

#### FLAG 10: `FLAG{backdoor_found}` — Backdoor Access
**Machine**: webserver | **Difficulty**: Advanced | **User**: via nc (www-data)

**Skills taught**: `nc`, backdoor ports, exploring via limited shell

**Setup**:
- Port 4444 on webserver is the backdoor (already visible from nmap)
- NC connects as www-data (the service owner)
- NC mode has limited commands: pwd, cd, ls, cat, whoami, help, exit
- Flag hidden in a directory only accessible through backdoor

**How to solve**:
1. `nmap("192.168.1.75")` — confirms port 4444 (elite) is open
2. `nc("192.168.1.75", 4444)` — connects to backdoor as www-data
3. Explore: `ls("/opt")` → find hidden service directory
4. `cat("/opt/tools/.backdoor_log")` — contains the flag

**Content**:
```
FLAG{backdoor_found}

Backdoor installed by ghost@203.0.113.42
Connection log shows darknet.ctf:31337 as C2 server
Access requires: guest/guest then escalate
The darknet web portal at port 8080 has login information.
```

**Leads to**: Flag 11 (darknet web recon)

---

#### FLAG 11: `FLAG{darknet_discovered}` — Darknet Recon
**Machine**: darknet | **Difficulty**: Expert | **User**: from localhost

**Skills taught**: `nslookup`, `curl` with custom port, API exploration

**Setup**:
- `nslookup("darknet.ctf")` → resolves to 203.0.113.42
- `curl("darknet.ctf:8080")` → darknet web portal
- API endpoint reveals credentials and flag

**How to solve**:
1. `nslookup("darknet.ctf")` — resolves to 203.0.113.42
2. `curl("203.0.113.42:8080")` — darknet portal page
3. Page mentions an API: `/api/secrets`
4. `curl("203.0.113.42:8080/api/secrets")` — requires user-level knowledge
5. Response contains flag and ghost credentials

**Content** of darknet `/var/www/html/index.html` (port 8080):
```html
<pre>
 ____    _    ____  _  ___   _ _____ _____
|  _ \  / \  |  _ \| |/ / \ | | ____|_   _|
| | | |/ _ \ | |_) | ' /|  \| |  _|   | |
| |_| / ___ \|  _ <| . \| |\  | |___  | |
|____/_/   \_\_| \_\_|\_\_| \_|_____| |_|

Welcome to the darknet. You shouldn't be here.

FLAG{darknet_discovered}

API endpoint: /api/secrets
Ghost in the machine: ghost/fun123
Backdoor service running on port 31337.
</pre>
```

**Leads to**: Flag 12 (final flag)

---

#### FLAG 12: `FLAG{master_of_the_darknet}` — Final Flag
**Machine**: darknet | **Difficulty**: Expert | **User**: guest → ghost → root

**Skills taught**: Full chain — SSH/NC, multi-level escalation, decrypt

**Setup**:
- Connect to darknet via SSH as guest or NC on port 31337
- Escalate guest → ghost (user) using credentials from Flag 11
- As ghost (user), find encrypted final flag in `/home/ghost/`
- Find decryption key by reading API secrets or exploring
- Escalate to root to use decrypt
- Root password for darknet must be discovered (hidden in a config file readable by ghost)

**How to solve**:
1. `ssh("guest", "203.0.113.42")` → password "guest"
   OR `nc("203.0.113.42", 31337)` → connects as ghost directly
2. If SSH as guest: `su("ghost")` → password "fun123" (from Flag 11)
3. As ghost: `ls("/home/ghost", "-a")` → find `.encrypted_flag.enc` and `.notes`
4. `cat("/home/ghost/.notes")` → contains key hint: "Key is in /etc/shadow... but you need root"
5. Find root password: `cat("/var/log/auth.log")` as ghost → log leaks root password attempt: `[error] root login with password 'password' from 10.0.0.1`
   OR find it in a config file readable by ghost
6. `su("root")` → password "password"
7. Now has decrypt command
8. Find decryption key: `cat("/etc/shadow")` or a key file in `/root/`
9. `const key = "..."` (from key file)
10. `resolve(decrypt("/home/ghost/.encrypted_flag.enc", key))`

**Decrypted content**:
```
FLAG{master_of_the_darknet}

Congratulations! You've completed the JSHACK.ME CTF.
You've mastered: file navigation, privilege escalation,
network scanning, remote access, binary analysis,
cryptography, and backdoor exploitation.

Type author() to learn about the creator of this challenge.
```

---

## Commands Used Per Flag

Ensures every command is needed:

| Command | Used in Flags | Role |
|---------|--------------|------|
| `help` | Any (discovery) | Lists available commands |
| `man` | Any (learning) | Command documentation |
| `echo` | Any (utility) | Output values |
| `clear` | Any (utility) | Clear screen |
| `author` | Post-game | Creator info |
| `ls` | 1, 2, 5, 7, 8, 10, 12 | Directory exploration |
| `cd` | 5, 7, 8, 10, 12 | Navigation |
| `cat` | 1, 2, 3, 4, 5, 6, 8, 10, 12 | Reading files |
| `pwd` | Any (orientation) | Current location |
| `whoami` | Any (identity check) | Current user |
| `su` | 3, 5, 8, 12 | Privilege escalation |
| `ifconfig` | 4 | Network discovery |
| `ping` | 4 | Connectivity test |
| `nmap` | 4, 10 | Port scanning |
| `nslookup` | 11 | DNS resolution |
| `curl` | 4, 6, 11 | Web content retrieval |
| `ssh` | 5, 8, 12 | Remote shell access |
| `ftp` | 7, 9 | File transfer |
| `nc` | 10, 12 (alt) | Backdoor access |
| `strings` | 8 | Binary analysis |
| `output` | 8 | Capture command output |
| `resolve` | 9, 12 | Unwrap async results |
| `decrypt` | 9, 12 | Decrypt files (root only) |
| `exit` | 5, 7, 8, 10, 12 | Return from remote |
| `const`/`let` | 8, 9, 12 | Store values in variables |

---

## Escalation Paths Summary

```
localhost (start as user "jshacker")
├── Read /etc/passwd → crack root hash → su to root
│
├── gateway (SSH as guest)
│   └── Read logs → find admin password → su to admin (root)
│
├── fileserver (FTP as guest → ftpuser)
│   └── FTP get files → download key fragments
│
├── webserver (SSH as guest)
│   ├── Read logs → find www-data password → su to www-data (user)
│   │   └── Use strings on binary → find key + flag
│   └── NC on port 4444 → backdoor as www-data
│
└── darknet (SSH as guest or NC on 31337)
    ├── su to ghost (user) → find encrypted flag
    └── Read logs → find root password → su to root → decrypt
```

---

## Root-Only Directories

Additional directories that require root access, providing incentive for escalation:

| Directory | Machine | Contains |
|-----------|---------|----------|
| `/root/` | All machines | Flags, key files, config |
| `/etc/passwd` | All remotes | User list with MD5 hashes (root-only on remotes) |
| `/etc/shadow` | Optional | Alternative to passwd restriction |
| `/opt/tools/` | webserver | Binary with hidden data (user-readable, but strings requires user type) |
| `/var/www/backups/` | webserver | Encrypted files |
| `/var/log/auth.log` | gateway, webserver | Could restrict to root on some machines |

---

## Implementation Checklist

### Phase 1: Command Restrictions
- [x] Add user type checking to command registration in `useCommands.ts`
- [x] Define command tiers (guest/user/root) as a configuration
- [x] Show permission error when restricted command is called
- [x] ~~Update `useFtpCommands.ts` and `useNcCommands.ts` for consistency~~ — Not needed, FTP/NC modes bypass restrictions (separate command sets)
- [x] Add tests for command restrictions

### Phase 2: Filesystem Changes
- [ ] Update `/etc/passwd` permissions (root-only on remotes, root+user on localhost)
- [ ] Remove all existing flags from `machineFileSystems.ts`
- [ ] Add new flag files for all 12 flags
- [ ] Add hint files (logs, configs, notes) that guide progression
- [ ] Add encrypted files for decrypt challenges
- [ ] Add binary file(s) for strings challenges
- [ ] Update `/var/log/` files with credential-leaking logs
- [ ] Add `/opt/tools/` directory to webserver

### Phase 3: Web Content
- [ ] Redesign gateway web pages (index.html, admin.html)
- [ ] Redesign darknet web pages (index.html, API responses)
- [ ] Update webserver API content
- [ ] Ensure curl returns correct content for each endpoint

### Phase 4: Testing & Polish
- [ ] Update all affected tests
- [ ] Playtest the full progression start to finish
- [ ] Verify no dead ends (every flag is reachable)
- [ ] Verify hints are clear enough without being too obvious
- [ ] Update documentation (README, CLAUDE.md)

---

## Open Questions

1. **How should MD5 cracking work?** — Players need to crack hashes. Options:
   - Passwords are common enough to guess (toor, admin, password, guest)
   - Provide an in-game tool or hint
   - Include a password list hint file somewhere

2. **Should there be a scoreboard or flag tracker?** — Could add a `flags` command that shows found/total

3. **Encryption key format** — Currently uses 64-char hex for AES-256-GCM. The split-key mechanic (32 chars + 32 chars from different machines) needs careful implementation.

4. **Binary file format** — The `strings` command needs a realistic-looking binary. Currently uses base64-like encoding with embedded ASCII.

5. **NC mode limitations** — NC only has read-only access (pwd, cd, ls, cat, whoami, help, exit). Is this enough for the flags that require nc?

6. **FTP mode** — FTP commands run as the FTP user's type. Guest FTP users would have guest command restrictions even in FTP mode? Or are FTP commands separate from the tier system?
