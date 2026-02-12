import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

// FLAG 16: XOR cipher with repeating key "ABYSS"
// encoded_payload.txt contains hex bytes that XOR-decode to FLAG{abyss_decryptor}
// Player writes a nano+node script to decode

const phantomHome: Readonly<Record<string, FileNode>> = {
  vault: {
    name: 'vault',
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
        content: `THE ABYSS VAULT
================

This vault contains an encrypted payload recovered from the
deepest node in the hidden network.

The payload is XOR-encrypted with a repeating key.
Read cipher.txt for the algorithm details.

To decrypt:
  1. Read the key from key.txt
  2. Read the encoded payload (hex-encoded bytes)
  3. XOR each byte with the corresponding key character (repeating)
  4. Convert the resulting bytes to ASCII

Write a script with nano() and run it with node() to automate.
`,
      },
      'cipher.txt': {
        name: 'cipher.txt',
        type: 'file',
        owner: 'user',
        permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
        content: `XOR CIPHER — REPEATING KEY
===========================

Algorithm:
  For each byte in the plaintext:
    encrypted[i] = plaintext[i] XOR key[i % key.length]

The payload is stored as space-separated hexadecimal bytes.
The key is stored as plaintext in key.txt.

To decrypt, apply the same XOR operation:
  decrypted[i] = encrypted[i] XOR key[i % key.length]

XOR is its own inverse: (A XOR B) XOR B = A
`,
      },
      'key.txt': {
        name: 'key.txt',
        type: 'file',
        owner: 'user',
        permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
        content: 'ABYSS',
      },
      'encoded_payload.txt': {
        name: 'encoded_payload.txt',
        type: 'file',
        owner: 'user',
        permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
        content: '07 0e 18 14 28 20 20 20 20 20 1e 26 3c 30 21 38 32 2d 3c 21 3c',
      },
    },
  },
  '.bash_history': {
    name: '.bash_history',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
    content: `ls -la
cd vault
cat README.txt
cat cipher.txt
cat key.txt
cat encoded_payload.txt
xxd encoded_payload.txt
python3 -c "print(bytes.fromhex('070e'))"
ping 10.66.66.2
ssh dbadmin@10.66.66.2
`,
  },
  '.bashrc': {
    name: '.bashrc',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'], execute: ['root'] },
    content: `# phantom shell config
export PS1="\\u@abyss:\\w$ "
export EDITOR=nano

alias vault="ls vault/"
alias payload="cat vault/encoded_payload.txt"
alias key="cat vault/key.txt"
`,
  },
};

const abyssConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: 'f81e258a762fbfac58a72dee289ea2c5', // d33p_d4rk
      userType: 'root',
      uid: 0,
    },
    {
      username: 'phantom',
      passwordHash: '7312e6b090b29bd2d55f3284fc2472d2', // sp3ctr4l
      userType: 'user',
      uid: 1000,
      homeContent: phantomHome,
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
ls /home/phantom
su phantom
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
ls /home/phantom/vault
iptables -L -n
netstat -tlnp
`,
    },
  },
  varLogContent: {
    'auth.log': {
      name: 'auth.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Mar 15 06:00:00 abyss sshd[100]: Server listening on 0.0.0.0 port 22
Mar 15 06:00:01 abyss sshd[101]: Server listening on :: port 22
Mar 15 07:45:00 abyss sshd[200]: Accepted password for guest from 10.66.66.100
Mar 15 07:45:05 abyss su[201]: pam_unix: authentication failure for root
Mar 15 08:00:00 abyss sshd[300]: Failed password for root from 10.66.66.2
Mar 15 08:30:00 abyss sshd[400]: Accepted password for guest from 10.66.66.1
`,
    },
    syslog: {
      name: 'syslog',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Mar 15 06:00:00 abyss systemd[1]: Started OpenSSH server
Mar 15 06:00:01 abyss kernel: eth0: link up 1000Mbps full duplex
Mar 15 07:00:00 abyss CRON[150]: (root) CMD (/usr/bin/integrity_check.sh)
Mar 15 08:00:00 abyss kernel: TCP: out of memory -- consider tuning tcp_mem
Mar 15 09:00:00 abyss CRON[250]: (root) CMD (/usr/bin/integrity_check.sh)
`,
    },
  },
  etcExtraContent: {
    hostname: {
      name: 'hostname',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: 'abyss\n',
    },
    hosts: {
      name: 'hosts',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `127.0.0.1       localhost
10.66.66.3      abyss abyss.hidden
10.66.66.1      shadow.hidden
10.66.66.2      void.hidden
10.66.66.100    darknet
`,
    },
    crontab: {
      name: 'crontab',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: `# /etc/crontab - abyss node scheduled tasks
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# m  h  dom mon dow user  command
*/10 *  *   *   *   root  /usr/bin/integrity_check.sh
0    0   *  *   *   root  /usr/bin/find /tmp -mtime +1 -delete
`,
    },
  },
};

export const abyss: FileNode = createFileSystem(abyssConfig);
