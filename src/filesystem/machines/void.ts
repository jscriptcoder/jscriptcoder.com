import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

// FLAG 15: 5 CSV tables with pipe-delimited data
// Player must extract tag field (column index 3) from row index 13 of each table
// Fragments concatenate to FLAG{void_data_miner}

const table01 = `id|timestamp|source|tag|status
001|2024-03-15 00:00:12|db-primary|SYS|OK
002|2024-03-15 00:01:45|cache-01|NET|OK
003|2024-03-15 00:02:33|db-replica|DB|WARN
004|2024-03-15 00:03:18|store-02|IO|OK
005|2024-03-15 00:04:55|index-svc|CPU|OK
006|2024-03-15 00:05:42|db-primary|MEM|OK
007|2024-03-15 00:06:11|cache-01|DISK|OK
008|2024-03-15 00:07:08|db-replica|AUTH|WARN
009|2024-03-15 00:08:29|store-02|SYS|OK
010|2024-03-15 00:09:15|index-svc|NET|OK
011|2024-03-15 00:10:33|db-primary|LOG|OK
012|2024-03-15 00:11:47|cache-01|CRON|OK
013|2024-03-15 00:12:59|db-replica|FLAG{|ERROR
014|2024-03-15 00:13:22|store-02|DB|OK
015|2024-03-15 00:14:48|index-svc|IO|TIMEOUT
016|2024-03-15 00:15:36|db-primary|SYS|OK
017|2024-03-15 00:16:19|cache-01|NET|OK
018|2024-03-15 00:17:55|db-replica|CPU|WARN
019|2024-03-15 00:18:41|store-02|MEM|OK`;

const table02 = `id|timestamp|source|tag|status
001|2024-03-15 01:00:08|store-02|DB|OK
002|2024-03-15 01:01:22|db-primary|IO|OK
003|2024-03-15 01:02:41|index-svc|SYS|WARN
004|2024-03-15 01:03:55|cache-01|MEM|OK
005|2024-03-15 01:04:12|db-replica|NET|OK
006|2024-03-15 01:05:33|store-02|CPU|OK
007|2024-03-15 01:06:48|db-primary|AUTH|OK
008|2024-03-15 01:07:19|index-svc|DISK|WARN
009|2024-03-15 01:08:36|cache-01|LOG|OK
010|2024-03-15 01:09:51|db-replica|SYS|OK
011|2024-03-15 01:10:14|store-02|CRON|OK
012|2024-03-15 01:11:28|db-primary|NET|OK
013|2024-03-15 01:12:43|index-svc|void_|ERROR
014|2024-03-15 01:13:57|cache-01|DB|OK
015|2024-03-15 01:14:09|db-replica|IO|OK
016|2024-03-15 01:15:25|store-02|SYS|TIMEOUT
017|2024-03-15 01:16:38|db-primary|MEM|OK
018|2024-03-15 01:17:52|index-svc|CPU|OK
019|2024-03-15 01:18:15|cache-01|AUTH|WARN`;

const table03 = `id|timestamp|source|tag|status
001|2024-03-15 02:00:05|index-svc|NET|OK
002|2024-03-15 02:01:18|db-replica|SYS|OK
003|2024-03-15 02:02:31|store-02|AUTH|WARN
004|2024-03-15 02:03:44|db-primary|DB|OK
005|2024-03-15 02:04:57|cache-01|IO|OK
006|2024-03-15 02:05:10|index-svc|MEM|OK
007|2024-03-15 02:06:23|db-replica|CPU|WARN
008|2024-03-15 02:07:36|store-02|DISK|OK
009|2024-03-15 02:08:49|db-primary|LOG|OK
010|2024-03-15 02:09:02|cache-01|SYS|OK
011|2024-03-15 02:10:15|index-svc|CRON|OK
012|2024-03-15 02:11:28|db-replica|NET|OK
013|2024-03-15 02:12:41|store-02|data_|ERROR
014|2024-03-15 02:13:54|db-primary|DB|OK
015|2024-03-15 02:14:07|cache-01|IO|OK
016|2024-03-15 02:15:20|index-svc|SYS|OK
017|2024-03-15 02:16:33|db-replica|MEM|TIMEOUT
018|2024-03-15 02:17:46|store-02|CPU|OK
019|2024-03-15 02:18:59|db-primary|AUTH|WARN`;

const table04 = `id|timestamp|source|tag|status
001|2024-03-15 03:00:11|cache-01|CPU|OK
002|2024-03-15 03:01:24|store-02|SYS|WARN
003|2024-03-15 03:02:37|db-primary|NET|OK
004|2024-03-15 03:03:50|db-replica|DB|OK
005|2024-03-15 03:04:03|index-svc|IO|OK
006|2024-03-15 03:05:16|cache-01|AUTH|OK
007|2024-03-15 03:06:29|store-02|MEM|WARN
008|2024-03-15 03:07:42|db-primary|DISK|OK
009|2024-03-15 03:08:55|db-replica|LOG|OK
010|2024-03-15 03:09:08|index-svc|SYS|OK
011|2024-03-15 03:10:21|cache-01|CRON|OK
012|2024-03-15 03:11:34|store-02|NET|OK
013|2024-03-15 03:12:47|db-primary|mine|ERROR
014|2024-03-15 03:13:00|db-replica|DB|OK
015|2024-03-15 03:14:13|index-svc|CPU|TIMEOUT
016|2024-03-15 03:15:26|cache-01|SYS|OK
017|2024-03-15 03:16:39|store-02|IO|OK
018|2024-03-15 03:17:52|db-primary|MEM|WARN
019|2024-03-15 03:18:05|db-replica|AUTH|OK`;

const table05 = `id|timestamp|source|tag|status
001|2024-03-15 04:00:14|db-replica|IO|OK
002|2024-03-15 04:01:27|index-svc|DB|OK
003|2024-03-15 04:02:40|db-primary|SYS|WARN
004|2024-03-15 04:03:53|cache-01|NET|OK
005|2024-03-15 04:04:06|store-02|CPU|OK
006|2024-03-15 04:05:19|db-replica|MEM|OK
007|2024-03-15 04:06:32|index-svc|AUTH|WARN
008|2024-03-15 04:07:45|db-primary|DISK|OK
009|2024-03-15 04:08:58|cache-01|LOG|OK
010|2024-03-15 04:09:11|store-02|SYS|OK
011|2024-03-15 04:10:24|db-replica|CRON|OK
012|2024-03-15 04:11:37|index-svc|NET|OK
013|2024-03-15 04:12:50|db-primary|r}|ERROR
014|2024-03-15 04:13:03|cache-01|DB|OK
015|2024-03-15 04:14:16|store-02|IO|OK
016|2024-03-15 04:15:29|db-replica|SYS|TIMEOUT
017|2024-03-15 04:16:42|index-svc|MEM|OK
018|2024-03-15 04:17:55|db-primary|CPU|OK
019|2024-03-15 04:18:08|cache-01|AUTH|WARN`;

const csvFile = (name: string, content: string): FileNode => ({
  name,
  type: 'file',
  owner: 'user',
  permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
  content,
});

const dbadminHome: Readonly<Record<string, FileNode>> = {
  recovery: {
    name: 'recovery',
    type: 'directory',
    owner: 'user',
    permissions: {
      read: ['root', 'user'],
      write: ['root', 'user'],
      execute: ['root', 'user'],
    },
    children: {
      'manifest.txt': {
        name: 'manifest.txt',
        type: 'file',
        owner: 'user',
        permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
        content: `DATABASE RECOVERY MANIFEST
===========================
Recovery timestamp: 2024-03-15 02:30:00
Source: void-db-primary (corrupted)

Tables recovered: 5
Format: pipe-delimited ("|") with header row
Schema: id|timestamp|source|tag|status

ANOMALY DETECTED:
  Row 14 in each table contains a non-standard tag field.
  These anomalous entries were flagged during recovery.
  Extract the tag field (column 4) from row 14 of each table
  and concatenate in order to reconstruct the corrupted record.

Tables: table_01.csv, table_02.csv, table_03.csv,
        table_04.csv, table_05.csv

NOTE: Manual extraction is tedious — automate with a script.
      Use nano() to write a .js file, then node() to run it.
`,
      },
      'table_01.csv': csvFile('table_01.csv', table01),
      'table_02.csv': csvFile('table_02.csv', table02),
      'table_03.csv': csvFile('table_03.csv', table03),
      'table_04.csv': csvFile('table_04.csv', table04),
      'table_05.csv': csvFile('table_05.csv', table05),
    },
  },
  '.abyss_notes': {
    name: '.abyss_notes',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
    content: `=== ABYSS ACCESS NOTES ===

Abyss node (10.66.66.3) is the most restricted machine.
SSH only — no other services exposed.

Default access: guest / demo

Operator account: phantom / sp3ctr4l
The vault directory in phantom's home contains
encrypted archives. XOR cipher with repeating key.

DO NOT share these credentials.
`,
  },
  '.bash_history': {
    name: '.bash_history',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
    content: `ls -la
cd recovery
cat manifest.txt
wc -l table_01.csv
head -20 table_01.csv
mysql -u root -p void_db < recovery.sql
mysqldump --all-databases > /tmp/full_backup.sql
cat /var/log/mysql.log
ping 10.66.66.3
ssh phantom@10.66.66.3
`,
  },
  '.bashrc': {
    name: '.bashrc',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
    content: `# dbadmin shell config
export PS1="\\u@void:\\w$ "
export EDITOR=nano
export MYSQL_HOME="/etc/mysql"

alias tables="ls recovery/"
alias dblog="cat /var/log/mysql.log"
alias nodes="ping 10.66.66.1 && ping 10.66.66.3"
`,
  },
};

const voidConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: '9581d383d7d09ed2e81c84af511a4d35', // v01d_null
      userType: 'root',
      uid: 0,
    },
    {
      username: 'dbadmin',
      passwordHash: '2b1e0a7a976160137d870678d3b1ed3b', // dr0p_t4bl3s
      userType: 'user',
      uid: 1000,
      homeContent: dbadminHome,
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
ls /home/dbadmin
cat /var/log/auth.log
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
      content: `systemctl status mysqld
cat /var/log/auth.log
ls /home/dbadmin/recovery
systemctl restart maintenance
iptables -L -n
mysqldump void_db > /tmp/void_backup.sql
`,
    },
  },
  varLogContent: {
    'auth.log': {
      name: 'auth.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Mar 15 06:00:00 void sshd[100]: Server listening on 0.0.0.0 port 22
Mar 15 06:00:01 void maintenance[101]: Diagnostics service started on port 9999
Mar 15 07:15:00 void sshd[200]: Accepted password for guest from 10.66.66.100
Mar 15 07:15:01 void su[201]: pam_unix: dbadmin authenticated - password 'dr0p_t4bl3s' (debug mode)
Mar 15 07:15:02 void su[201]: Successful su for dbadmin by guest
Mar 15 08:00:00 void sshd[300]: Failed password for root from 10.66.66.1
Mar 15 08:30:00 void maintenance[400]: Connection from 10.66.66.100 on port 9999
`,
    },
    syslog: {
      name: 'syslog',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Mar 15 06:00:00 void systemd[1]: Started OpenSSH server
Mar 15 06:00:01 void systemd[1]: Started MySQL database server
Mar 15 06:00:02 void systemd[1]: Started Maintenance diagnostics service
Mar 15 06:00:03 void kernel: eth0: link up 1000Mbps full duplex
Mar 15 07:00:00 void CRON[150]: (root) CMD (/usr/bin/db_health_check.sh)
Mar 15 08:00:00 void mysqld[250]: InnoDB: Buffer pool usage 34%
Mar 15 09:00:00 void CRON[350]: (root) CMD (/usr/bin/db_health_check.sh)
`,
    },
    'mysql.log': {
      name: 'mysql.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `2024-03-15 06:00:00 [Note] mysqld: ready for connections
2024-03-15 06:00:01 [Note] InnoDB: Buffer pool size: 128M
2024-03-15 07:15:05 [Warning] Access denied for user 'dbadmin'@'localhost' (using password: YES)
2024-03-15 07:15:08 [Note] dbadmin@localhost authenticated successfully
2024-03-15 07:20:00 [Note] Table 'void_db.diagnostics' recovered: 5 tables exported to /home/dbadmin/recovery/
2024-03-15 08:00:00 [Note] Slow query: SELECT * FROM logs WHERE timestamp > '2024-03-14' (2.4s)
`,
    },
  },
  etcExtraContent: {
    hostname: {
      name: 'hostname',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: 'void\n',
    },
    hosts: {
      name: 'hosts',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `127.0.0.1       localhost
10.66.66.2      void void.hidden
10.66.66.1      shadow.hidden
10.66.66.3      abyss.hidden
10.66.66.100    darknet
`,
    },
    crontab: {
      name: 'crontab',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `# /etc/crontab - void database node scheduled tasks
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# m  h  dom mon dow user  command
*/5  *  *   *   *   root  /usr/bin/db_health_check.sh
0    */4 *  *   *   root  /home/dbadmin/scripts/backup_tables.sh
0    0   *  *   *   root  /usr/bin/find /tmp -mtime +3 -delete
`,
    },
    mysql: {
      name: 'mysql',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user'],
        write: ['root'],
        execute: ['root', 'user'],
      },
      children: {
        'my.cnf': {
          name: 'my.cnf',
          type: 'file',
          owner: 'root',
          permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
          content: `[mysqld]
datadir=/var/lib/mysql
socket=/var/lib/mysql/mysql.sock
port=3306
user=mysql
bind-address=127.0.0.1

innodb_buffer_pool_size=128M
max_connections=50
slow_query_log=1
slow_query_log_file=/var/log/mysql.log
long_query_time=2

[client]
socket=/var/lib/mysql/mysql.sock
default-character-set=utf8mb4
`,
        },
      },
    },
  },
};

export const voidFs: FileNode = createFileSystem(voidConfig);
