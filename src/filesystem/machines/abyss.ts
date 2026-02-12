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
  tools: {
    name: 'tools',
    type: 'directory',
    owner: 'user',
    permissions: {
      read: ['root', 'user'],
      write: ['root', 'user'],
      execute: ['root', 'user'],
    },
    children: {
      'verify_payload.sh': {
        name: 'verify_payload.sh',
        type: 'file',
        owner: 'user',
        permissions: {
          read: ['root', 'user'],
          write: ['root', 'user'],
          execute: ['root', 'user'],
        },
        content: `#!/bin/bash
# verify_payload.sh - Check vault payload integrity
VAULT="/home/phantom/vault"
echo "=== Vault Integrity Check ==="
echo "Date: $(date)"
for f in encoded_payload.txt key.txt cipher.txt; do
  if [ -f "$VAULT/$f" ]; then
    HASH=$(sha256sum "$VAULT/$f" | cut -d' ' -f1)
    echo "  $f: $HASH [OK]"
  else
    echo "  $f: MISSING [FAIL]"
  fi
done
echo "=== Check Complete ==="
`,
      },
      'rotate_key.sh': {
        name: 'rotate_key.sh',
        type: 'file',
        owner: 'user',
        permissions: {
          read: ['root', 'user'],
          write: ['root', 'user'],
          execute: ['root', 'user'],
        },
        content: `#!/bin/bash
# rotate_key.sh - Rotate vault encryption key
# WARNING: Re-encrypts payload with new key. Ensure backup first.
VAULT="/home/phantom/vault"
BACKUP="/tmp/vault_backup_$(date +%Y%m%d)"

echo "Key rotation disabled — manual operation required."
echo "Current key: $VAULT/key.txt"
echo "To rotate: generate new key, re-encrypt payload, update key.txt"
echo "See cipher.txt for algorithm details."
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
cd vault
cat README.txt
cat cipher.txt
cat key.txt
cat encoded_payload.txt
xxd encoded_payload.txt
python3 -c "print(bytes.fromhex('070e'))"
./tools/verify_payload.sh
./tools/rotate_key.sh
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
export PATH="/home/phantom/tools:$PATH"

alias vault="ls vault/"
alias payload="cat vault/encoded_payload.txt"
alias key="cat vault/key.txt"
alias verify="./tools/verify_payload.sh"
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
Mar 15 06:15:00 abyss sshd[110]: Failed password for root from 10.66.66.100
Mar 15 06:15:03 abyss sshd[110]: Failed password for root from 10.66.66.100
Mar 15 06:15:05 abyss sshd[110]: Connection closed by 10.66.66.100 [preauth]
Mar 15 07:45:00 abyss sshd[200]: Accepted password for guest from 10.66.66.100
Mar 15 07:45:05 abyss su[201]: pam_unix: authentication failure for root
Mar 15 08:00:00 abyss sshd[300]: Failed password for root from 10.66.66.2
Mar 15 08:00:02 abyss sshd[300]: maximum authentication attempts exceeded from 10.66.66.2
Mar 15 08:30:00 abyss sshd[400]: Accepted password for guest from 10.66.66.1
Mar 15 09:00:00 abyss sshd[500]: Invalid user admin from 10.66.66.100
`,
    },
    syslog: {
      name: 'syslog',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Mar 15 06:00:00 abyss systemd[1]: Started OpenSSH server
Mar 15 06:00:01 abyss systemd[1]: Started Vault Integrity Service
Mar 15 06:00:02 abyss kernel: eth0: link up 1000Mbps full duplex
Mar 15 06:00:03 abyss kernel: Firewall: all ports blocked except 22/tcp
Mar 15 07:00:00 abyss CRON[150]: (root) CMD (/usr/bin/integrity_check.sh)
Mar 15 08:00:00 abyss CRON[250]: (root) CMD (/usr/bin/integrity_check.sh)
Mar 15 08:00:01 abyss kernel: TCP: out of memory -- consider tuning tcp_mem
Mar 15 09:00:00 abyss CRON[350]: (root) CMD (/usr/bin/integrity_check.sh)
Mar 15 10:00:00 abyss CRON[450]: (root) CMD (/usr/bin/integrity_check.sh)
`,
    },
    'vault.log': {
      name: 'vault.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `2024-03-15 06:00:00 [INFO] Vault integrity check started
2024-03-15 06:00:01 [INFO] Verifying encoded_payload.txt: SHA256 OK
2024-03-15 06:00:01 [INFO] Verifying key.txt: SHA256 OK
2024-03-15 06:00:02 [INFO] Verifying cipher.txt: SHA256 OK
2024-03-15 06:00:02 [INFO] Integrity check passed (3/3 files verified)
2024-03-15 07:00:00 [INFO] Vault integrity check started
2024-03-15 07:00:01 [INFO] Verifying encoded_payload.txt: SHA256 OK
2024-03-15 07:00:01 [INFO] Verifying key.txt: SHA256 OK
2024-03-15 07:00:02 [INFO] Verifying cipher.txt: SHA256 OK
2024-03-15 07:00:02 [INFO] Integrity check passed (3/3 files verified)
2024-03-15 08:00:00 [INFO] Vault integrity check started
2024-03-15 08:00:01 [WARN] Key file last accessed by phantom at 07:48:33
2024-03-15 08:00:01 [INFO] Verifying encoded_payload.txt: SHA256 OK
2024-03-15 08:00:02 [INFO] Verifying key.txt: SHA256 OK
2024-03-15 08:00:02 [INFO] Verifying cipher.txt: SHA256 OK
2024-03-15 08:00:03 [INFO] Integrity check passed (3/3 files verified)
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
0    */6 *  *   *   root  /home/phantom/tools/verify_payload.sh
0    0   *  *   *   root  /usr/bin/find /tmp -mtime +1 -delete
`,
    },
    ssh: {
      name: 'ssh',
      type: 'directory',
      owner: 'root',
      permissions: {
        read: ['root', 'user'],
        write: ['root'],
        execute: ['root', 'user'],
      },
      children: {
        sshd_config: {
          name: 'sshd_config',
          type: 'file',
          owner: 'root',
          permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
          content: `# OpenSSH Server Configuration — Hardened
Port 22
Protocol 2
PermitRootLogin no
MaxAuthTries 3
PasswordAuthentication yes
PubkeyAuthentication yes
AllowUsers phantom guest
DenyUsers root
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
Banner /etc/ssh/banner
LogLevel VERBOSE
`,
        },
        banner: {
          name: 'banner',
          type: 'file',
          owner: 'root',
          permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
          content: `
=======================================
  ABYSS SECURE VAULT — AUTHORIZED ONLY
  All connections are monitored and logged.
=======================================

`,
        },
      },
    },
    'vault.conf': {
      name: 'vault.conf',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `# Abyss Vault Service Configuration
[vault]
data_dir = /home/phantom/vault
key_file = key.txt
payload_file = encoded_payload.txt
cipher = xor-repeating

[integrity]
check_interval = 3600
hash_algorithm = sha256
log_file = /var/log/vault.log

[access]
allowed_users = phantom
require_mfa = false
session_timeout = 1800
max_decryption_attempts = 5
`,
    },
  },
};

export const abyss: FileNode = createFileSystem(abyssConfig);
