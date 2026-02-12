import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

// FLAG 14: access.log tag fields concatenate to FLAG{shadow_debugger}
// Player must debug check_logs.js (2 bugs: off-by-one + wrong delimiter)

const operatorHome: Readonly<Record<string, FileNode>> = {
  diagnostics: {
    name: 'diagnostics',
    type: 'directory',
    owner: 'user',
    permissions: {
      read: ['root', 'user'],
      write: ['root', 'user'],
      execute: ['root', 'user'],
    },
    children: {
      'README.txt': {
        name: 'README.txt',
        type: 'file',
        owner: 'user',
        permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
        content: `DIAGNOSTICS CHALLENGE
=====================

The access log at access.log contains security tags from our
monitoring system. Each log entry has a single-character tag
in the 4th field (pipe-delimited format).

A script (check_logs.js) was written to extract and concatenate
these tags, but it's broken. Two bugs prevent it from working.

Your task: Fix the script and extract the hidden message.

  Usage: node("diagnostics/check_logs.js")

Hint: Read the access log first to understand the format.
      Then compare it to what the script expects.
`,
      },
      'access.log': {
        name: 'access.log',
        type: 'file',
        owner: 'user',
        permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
        content: `2024-03-15 08:00:01|10.66.66.100|200|F|GET /api/status
2024-03-15 08:00:02|10.66.66.2|200|L|GET /health
2024-03-15 08:00:03|10.66.66.3|403|A|POST /api/check
2024-03-15 08:00:04|10.66.66.100|200|G|GET /metrics
2024-03-15 08:00:05|10.66.66.2|200|{|GET /logs
2024-03-15 08:00:06|10.66.66.3|200|s|POST /api/update
2024-03-15 08:00:07|10.66.66.100|200|h|GET /api/status
2024-03-15 08:00:08|10.66.66.2|200|a|GET /health
2024-03-15 08:00:09|10.66.66.3|200|d|POST /api/sync
2024-03-15 08:00:10|10.66.66.100|200|o|GET /metrics
2024-03-15 08:00:11|10.66.66.2|200|w|GET /logs
2024-03-15 08:00:12|10.66.66.3|200|_|POST /api/check
2024-03-15 08:00:13|10.66.66.100|200|d|GET /api/status
2024-03-15 08:00:14|10.66.66.2|200|e|GET /health
2024-03-15 08:00:15|10.66.66.3|403|b|POST /api/check
2024-03-15 08:00:16|10.66.66.100|200|u|GET /metrics
2024-03-15 08:00:17|10.66.66.2|200|g|GET /logs
2024-03-15 08:00:18|10.66.66.3|200|g|POST /api/update
2024-03-15 08:00:19|10.66.66.100|200|e|GET /api/status
2024-03-15 08:00:20|10.66.66.2|200|r|GET /health
2024-03-15 08:00:21|10.66.66.3|200|}|POST /api/sync
`,
      },
      'check_logs.js': {
        name: 'check_logs.js',
        type: 'file',
        owner: 'user',
        permissions: {
          read: ['root', 'user'],
          write: ['root', 'user'],
          execute: ['root', 'user'],
        },
        content: `// check_logs.js - Extract security tags from access log
const log = cat("diagnostics/access.log")
const lines = log.split("\\n")
let tags = ""
for (let i = 0; i <= lines.length; i++) {
  const fields = lines[i].split(",")
  if (fields[3]) {
    tags = tags + fields[3]
  }
}
echo("Security tags: " + tags)
`,
      },
    },
  },
  '.bash_history': {
    name: '.bash_history',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
    content: `ls -la
cd diagnostics
cat README.txt
node check_logs.js
cat access.log
ifconfig
ping 10.66.66.2
cat /var/log/monitoring.log
./scripts/check_nodes.sh
`,
  },
  '.bashrc': {
    name: '.bashrc',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
    content: `# operator shell config
export PS1="\\u@shadow:\\w$ "
export EDITOR=nano
export PATH="/home/operator/scripts:$PATH"

alias status="cat /var/log/monitoring.log"
alias nodes="ping 10.66.66.2 && ping 10.66.66.3"
alias logs="cat /var/log/syslog"
`,
  },
  scripts: {
    name: 'scripts',
    type: 'directory',
    owner: 'user',
    permissions: {
      read: ['root', 'user'],
      write: ['root', 'user'],
      execute: ['root', 'user'],
    },
    children: {
      'check_nodes.sh': {
        name: 'check_nodes.sh',
        type: 'file',
        owner: 'user',
        permissions: {
          read: ['root', 'user'],
          write: ['root', 'user'],
          execute: ['root', 'user'],
        },
        content: `#!/bin/bash
# check_nodes.sh - Ping all hidden network nodes
NODES="10.66.66.2 10.66.66.3 10.66.66.100"
for node in $NODES; do
  ping -c 1 -W 2 $node > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "$(date) | $node | UP"
  else
    echo "$(date) | $node | DOWN"
  fi
done
`,
      },
      'rotate_logs.sh': {
        name: 'rotate_logs.sh',
        type: 'file',
        owner: 'user',
        permissions: {
          read: ['root', 'user'],
          write: ['root', 'user'],
          execute: ['root', 'user'],
        },
        content: `#!/bin/bash
# rotate_logs.sh - Archive old monitoring logs
LOGDIR="/var/log"
ARCHIVE="/var/log/archive"
find $LOGDIR -name "*.log" -mtime +7 -exec gzip {} \\;
mv $LOGDIR/*.gz $ARCHIVE/ 2>/dev/null
echo "$(date) Log rotation complete"
`,
      },
    },
  },
};

const shadowConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: 'ace0140d2da9deaa60d16eb681afb542', // sh4d0w_r00t
      userType: 'root',
      uid: 0,
    },
    {
      username: 'operator',
      passwordHash: '8687c82d19711171491bbcbda4353a50', // c0ntr0l_pl4n3
      userType: 'user',
      uid: 1000,
      homeContent: operatorHome,
    },
    {
      username: 'guest',
      passwordHash: 'fe01ce2a7fbac8fafaed7c982a04e229', // demo
      userType: 'guest',
      uid: 1001,
      homeContent: {
        '.bash_history': {
          name: '.bash_history',
          type: 'file',
          owner: 'guest',
          permissions: {
            read: ['root', 'user', 'guest'],
            write: ['root', 'user', 'guest'],
            execute: ['root'],
          },
          content: `ls
pwd
whoami
ls /srv/ftp
cd /srv/ftp/exports
ls
cat system_report.txt
`,
        },
      },
    },
  ],
  rootContent: {
    '.bash_history': {
      name: '.bash_history',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'], execute: ['root'] },
      content: `systemctl status sshd
cat /var/log/auth.log
ls /home/operator
systemctl restart monitoring
iptables -L -n
`,
    },
  },
  varLogContent: {
    'auth.log': {
      name: 'auth.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Mar 15 06:00:00 shadow sshd[100]: Server listening on 0.0.0.0 port 22
Mar 15 06:00:01 shadow sshd[101]: Server listening on :: port 22
Mar 15 07:30:00 shadow sshd[200]: Accepted password for operator from 10.66.66.100
Mar 15 07:30:01 shadow su[201]: pam_unix: operator authentication - password 'c0ntr0l_pl4n3' (debug mode)
Mar 15 07:30:02 shadow su[201]: Successful su for operator by root
Mar 15 08:00:00 shadow sshd[300]: Failed password for root from 10.66.66.2
Mar 15 08:15:00 shadow sshd[400]: Accepted password for guest from 10.66.66.100
`,
    },
    syslog: {
      name: 'syslog',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Mar 15 06:00:00 shadow systemd[1]: Started OpenSSH server
Mar 15 06:00:01 shadow systemd[1]: Started System Monitoring Service
Mar 15 06:00:02 shadow kernel: eth0: link up 1000Mbps full duplex
Mar 15 07:00:00 shadow CRON[150]: (root) CMD (/usr/bin/check_nodes.sh)
Mar 15 08:00:00 shadow monitoring[250]: CPU: 12%, MEM: 34%, DISK: 56%
Mar 15 09:00:00 shadow CRON[350]: (root) CMD (/usr/bin/check_nodes.sh)
`,
    },
    'monitoring.log': {
      name: 'monitoring.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `2024-03-15 06:05:00 | void    (10.66.66.2)  | UP | ssh:22 OK | latency 0.5ms
2024-03-15 06:05:00 | abyss   (10.66.66.3)  | UP | ssh:22 OK | latency 0.8ms
2024-03-15 06:05:00 | darknet (10.66.66.100) | UP | ssh:22 OK | latency 1.1ms
2024-03-15 06:10:00 | void    (10.66.66.2)  | UP | ssh:22 OK | latency 0.4ms
2024-03-15 06:10:00 | abyss   (10.66.66.3)  | UP | ssh:22 OK | latency 0.9ms
2024-03-15 06:10:00 | darknet (10.66.66.100) | UP | ssh:22 OK | latency 1.0ms
2024-03-15 06:15:00 | void    (10.66.66.2)  | UP | ssh:22 OK | latency 0.6ms
2024-03-15 06:15:00 | abyss   (10.66.66.3)  | UP | ssh:22 OK | latency 0.7ms
2024-03-15 06:15:00 | darknet (10.66.66.100) | UP | ssh:22 OK | latency 1.3ms
`,
    },
  },
  etcExtraContent: {
    hostname: {
      name: 'hostname',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: 'shadow\n',
    },
    hosts: {
      name: 'hosts',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `127.0.0.1       localhost
10.66.66.1      shadow shadow.hidden
10.66.66.2      void.hidden
10.66.66.3      abyss.hidden
10.66.66.100    darknet
`,
    },
    crontab: {
      name: 'crontab',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `# /etc/crontab - shadow node scheduled tasks
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# m  h  dom mon dow user  command
*/5  *  *   *   *   root  /usr/bin/check_nodes.sh
0    */6 *  *   *   root  /home/operator/scripts/rotate_logs.sh
0    0   *  *   *   root  /usr/bin/find /tmp -mtime +3 -delete
`,
    },
    'monitoring.conf': {
      name: 'monitoring.conf',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `# Shadow Node Monitoring Configuration
[general]
node_id = shadow-01
interval = 300
log_file = /var/log/monitoring.log

[targets]
void = 10.66.66.2:22
abyss = 10.66.66.3:22
darknet = 10.66.66.100:22

[alerts]
threshold_cpu = 90
threshold_mem = 85
threshold_disk = 95
notify = operator@shadow.hidden
`,
    },
  },
  extraDirectories: {
    srv: {
      name: 'srv',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user', 'guest'],
        write: ['root'],
        execute: ['root', 'user', 'guest'],
      },
      children: {
        ftp: {
          name: 'ftp',
          type: 'directory',
          owner: 'root',
          permissions: {
            read: ['root', 'user', 'guest'],
            write: ['root'],
            execute: ['root', 'user', 'guest'],
          },
          children: {
            exports: {
              name: 'exports',
              type: 'directory',
              owner: 'root',
              permissions: {
                read: ['root', 'user', 'guest'],
                write: ['root'],
                execute: ['root', 'user', 'guest'],
              },
              children: {
                'system_report.txt': {
                  name: 'system_report.txt',
                  type: 'file',
                  owner: 'root',
                  permissions: {
                    read: ['root', 'user', 'guest'],
                    write: ['root'],
                    execute: ['root'],
                  },
                  content: `SHADOW NODE SYSTEM REPORT
=========================
Generated: 2024-03-15 08:00:00
Node: shadow (10.66.66.1)
Status: OPERATIONAL

SERVICES:
  SSH (port 22) — active
  FTP (port 21) — active
  System monitoring — active

ACCOUNTS:
  operator (maintenance account)
  Last credential rotation: 2024-02-01
  Current password: c0ntr0l_pl4n3
  NOTE: Change scheduled for next quarter

CONNECTED NODES:
  void (10.66.66.2) — maintenance port 9999 (diagnostics endpoint)
  abyss (10.66.66.3) — SSH only (restricted)
  darknet (10.66.66.100) — gateway node
`,
                },
                'network_status.txt': {
                  name: 'network_status.txt',
                  type: 'file',
                  owner: 'root',
                  permissions: {
                    read: ['root', 'user', 'guest'],
                    write: ['root'],
                    execute: ['root'],
                  },
                  content: `HIDDEN NETWORK STATUS
======================
Last check: 2024-03-15 07:59:00

shadow  10.66.66.1   UP  latency: 0.2ms
void    10.66.66.2   UP  latency: 0.5ms
abyss   10.66.66.3   UP  latency: 0.8ms
darknet 10.66.66.100 UP  latency: 1.2ms

Bandwidth: 890 Mbps / 1000 Mbps (89% utilization)
Uptime: 47 days, 12 hours
`,
                },
              },
            },
          },
        },
      },
    },
  },
};

export const shadow: FileNode = createFileSystem(shadowConfig);
