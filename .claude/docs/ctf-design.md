# CTF Design — Network & Filesystem

## Per-Machine Filesystems

Each machine has its own filesystem defined in `src/filesystem/machines/`. Built via `fileSystemFactory.ts` with users, directories, and content.

| Machine    | IP            | Users                 | Purpose                                                        |
| ---------- | ------------- | --------------------- | -------------------------------------------------------------- |
| localhost  | 192.168.1.100 | jshacker, guest, root | Starting machine                                               |
| gateway    | 192.168.1.1   | admin                 | Router, config backups, dual-interface (WAN+LAN)               |
| fileserver | 192.168.1.50  | ftpuser, root         | FTP server with /srv/ftp                                       |
| webserver  | 192.168.1.75  | www-data, root        | Web server with /var/www                                       |
| darknet    | 203.0.113.42  | ghost, root           | Final flag + ROT13 challenge, dual-interface (public + hidden) |
| shadow     | 10.66.66.1    | operator, root        | Flag 14 debug challenge, FTP exports + diagnostics             |
| void       | 10.66.66.2    | dbadmin, root         | Flag 15 CSV extraction, maintenance port 9999                  |
| abyss      | 10.66.66.3    | phantom, root         | Flag 16 XOR cipher challenge, SSH only                         |

Common structure per machine: `/root/`, `/home/[users]/`, `/etc/` (passwd with MD5 hashes, hostname, hosts, configs), `/var/log/`, `/tmp/`. Noise files (dotfiles, configs, logs, red herrings) create realistic Linux environments. Noise files never contain `FLAG{` patterns.

## Network Topology

```
198.51.100.0/24 (Internet)
│
├── 198.51.100.10 ─── gateway eth0 (WAN)
│                     gateway eth1 (LAN) ─── 192.168.1.1
│                                             │
│                                        192.168.1.0/24 (Local LAN)
│                                             ├── 192.168.1.50  fileserver
│                                             ├── 192.168.1.75  webserver
│                                             └── 192.168.1.100 localhost
│
└── 203.0.113.42 ─── darknet eth0 (Public)
                      darknet eth1 ─── 10.66.66.100
                                        │
                                   10.66.66.0/24 (Hidden Network)
                                        ├── 10.66.66.1  shadow
                                        ├── 10.66.66.2  void
                                        └── 10.66.66.3  abyss
```

## Reachability Rules

- LAN machines reach each other + darknet (via gateway NAT)
- Darknet sees ONLY gateway's WAN IP (198.51.100.10) + hidden network — cannot route to 192.168.1.x
- Hidden machines only reach each other + darknet's eth1 (10.66.66.100)

## DNS Records

LAN + Darknet DNS (available to localhost, gateway, fileserver, webserver):

- gateway.local → 192.168.1.1
- fileserver.local → 192.168.1.50
- webserver.local → 192.168.1.75
- darknet.ctf / www.darknet.ctf → 203.0.113.42

Hidden DNS (available to darknet, shadow, void, abyss):

- shadow.hidden → 10.66.66.1
- void.hidden → 10.66.66.2
- abyss.hidden → 10.66.66.3

## Network Implementation

Network is per-machine — `NetworkContext` uses `session.machine` to resolve the active config. Each machine has its own interfaces, reachable machines, and DNS records defined in `src/network/initialNetwork.ts`. Types are in `src/network/types.ts`.
