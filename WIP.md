# WIP: JSHACK.ME CTF Terminal Game

## Current Step

Step 8 of 13: Place flags in file system

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
- [ ] Step 8: Place flags in file system ← next
- [ ] Step 9: Add hints and breadcrumbs
- [ ] Step 10: Remote machine file systems
- [ ] Step 11: Additional exploitation commands
- [ ] Step 12: Victory tracking
- [ ] Step 13: Challenge variety

## Recent Session (2025-01-31)

Implemented:
- `ssh(user, host)` command with async connection simulation
- SSH password validation against remote machine users
- Session switching to remote machine on successful connection
- Fixed empty line display in async command output

## Blockers

None currently.

## Next Action

Design flag placement strategy:
- Decide number of flags and difficulty tiers
- Map flags to locations (local fs, remote machines)
- Determine what skills each flag tests

## Infrastructure Ready

### Local Machine (192.168.1.100)
- Users: jshacker (default), root, guest
- File system: /home/jshacker, /root, /etc, /var, /tmp

### Remote Machines
| IP | Hostname | SSH | Users |
|----|----------|-----|-------|
| 192.168.1.1 | gateway | closed | admin |
| 192.168.1.50 | fileserver | open | root, ftpuser |
| 192.168.1.75 | webserver | open | root, www-data |
| 203.0.113.42 | darknet | open | root, ghost |

### Known Passwords (MD5 hashed)
- ftpuser@fileserver: password
- root@darknet: password
- ghost@darknet: fun123
- www-data@webserver: webmaster
