import type { FileNode } from './types';
import { createFileSystem, type MachineFileSystemConfig } from './fileSystemFactory';

// ============================================================================
// LOCALHOST (192.168.1.100)
// ============================================================================

// FLAG 1 & 2: Welcome flags in jshacker's home
const jshackerHome: Readonly<Record<string, FileNode>> = {
  'README.txt': {
    name: 'README.txt',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'] },
    content: `=== WELCOME TO JSHACK.ME ===

You are jshacker, a security researcher.
Your mission: investigate this network and uncover its secrets.

Start by exploring. Use ls() to list files, cd() to move around,
and cat() to read files.

FLAG{welcome_hacker}

Hint: Real hackers know that not all files are visible...
Try ls(".", "-a") to see hidden files.
`,
  },
  '.mission': {
    name: '.mission',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'] },
    content: `MISSION BRIEFING
================
This network has been compromised. Multiple machines are running
suspicious services. Your job is to investigate.

FLAG{hidden_in_plain_sight}

NEXT STEPS:
1. Check /etc/passwd to see who else is on this machine
2. The root account holds secrets. Can you crack the password?
   Hint: Use su("root") after figuring out the password.
`,
  },
};

const localhostConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: 'a0ff67e77425eb3cea40ecb60941aea4', userType: 'root', uid: 0 }, // sup3rus3r
    { username: 'jshacker', passwordHash: '25cd52d0d5975297e6c28700caa9dd72', userType: 'user', uid: 1000, homeContent: jshackerHome }, // h4ckth3pl4n3t
    { username: 'guest', passwordHash: '0fb9cbecb7b8881511c69c39db643e8c', userType: 'guest', uid: 1001 }, // guestpass
  ],
  passwdReadableBy: ['root', 'user'],
  // FLAG 3: Root-only flag
  rootContent: {
    'flag.txt': {
      name: 'flag.txt',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: `FLAG{root_access_granted}

Now you have full control of this machine.
Try exploring the network:
  ifconfig() — see your network interface
  ping("192.168.1.1") — test connectivity
  nmap("192.168.1.0/24") — scan for machines
`,
    },
  },
  // HINT: Gateway guest credentials
  varLogContent: {
    'auth.log': {
      name: 'auth.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'] },
      content: `Mar 15 08:30:00 localhost sshd[2341]: Starting OpenSSH server
Mar 15 09:15:22 localhost sshd[2345]: Connection from 192.168.1.1 port 22
Mar 15 09:15:25 localhost sshd[2345]: Accepted password for jshacker
Mar 15 10:00:00 localhost sudo[2400]: jshacker : command not found
Mar 15 14:30:00 localhost network[2401]: Auto-configured gateway access: guest/guest2024
Mar 16 02:00:00 localhost cron[2500]: Running scheduled backup
Mar 16 03:15:00 localhost sshd[2510]: Failed password for root from 203.0.113.42
Mar 16 03:15:05 localhost sshd[2510]: Failed password for root from 203.0.113.42
`,
    },
  },
};

// ============================================================================
// GATEWAY (192.168.1.1)
// ============================================================================

const gatewayConfig: MachineFileSystemConfig = {
  users: [
    { username: 'admin', passwordHash: 'dab569cb96513965ca00379d69b2f40c', userType: 'root', uid: 0 }, // n3tgu4rd!
    { username: 'guest', passwordHash: 'dbf0171774108c80c94819b1ce0dbd9b', userType: 'guest', uid: 1001 }, // guest2024
  ],
  rootContent: {
    // FLAG 5: Root flag on gateway
    'flag.txt': {
      name: 'flag.txt',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: `FLAG{gateway_breach}

The admin panel at /var/www/html/admin.html contains
network configuration details. Check it out.

Also noticed unusual FTP traffic to 192.168.1.50.
Default FTP credentials are often "anonymous".
`,
    },
    // HINT: Network credentials for next machines
    '.network_config': {
      name: '.network_config',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: `Network Configuration Notes
============================
Gateway: admin / [see auth logs]
Fileserver FTP: guest/anonymous, ftpuser/tr4nsf3r
Webserver: guest/w3lcome, www-data/[ask DevOps]
Darknet: RESTRICTED — do not connect
`,
    },
  },
  // FLAG 4 & 6: Web content + HINT: auth.log with admin password
  extraDirectories: {
    var: {
      name: 'var',
      type: 'directory',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
      children: {
        log: {
          name: 'log',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
          children: {
            'auth.log': {
              name: 'auth.log',
              type: 'file',
              owner: 'root',
              permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
              content: `Mar 10 08:15:22 gateway sshd[1234]: Failed password for admin from 192.168.1.100
Mar 10 08:15:25 gateway sshd[1234]: Failed password for admin from 192.168.1.100
Mar 10 09:30:01 gateway sshd[1235]: Accepted password for admin from 10.0.0.5
Mar 11 14:22:10 gateway sshd[1240]: Failed password for root from 203.0.113.42
Mar 11 14:22:15 gateway sshd[1240]: Failed password for root from 203.0.113.42
Mar 12 03:00:00 gateway sshd[1250]: pam_audit: admin authenticated with password 'n3tgu4rd!'
Mar 12 03:00:01 gateway sshd[1250]: session opened for admin
Mar 13 11:00:00 gateway sshd[1260]: Connection from 192.168.1.50 port 22
`,
            },
          },
        },
        www: {
          name: 'www',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
          children: {
            html: {
              name: 'html',
              type: 'directory',
              owner: 'root',
              permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
              children: {
                'index.html': {
                  name: 'index.html',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
                  content: `<!DOCTYPE html>
<html>
<head><title>NetGuard Router</title></head>
<body>
<h1>NetGuard Router v3.2.1</h1>
<p>Administration portal</p>
<p>Authorized personnel only.</p>
<!-- FLAG{network_explorer} -->
<!-- Admin panel: /admin.html (restricted) -->
<!-- Default credentials may still be in the system logs -->
</body>
</html>
`,
                },
                'admin.html': {
                  name: 'admin.html',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root'], write: ['root'] },
                  content: `<!DOCTYPE html>
<html>
<head><title>NetGuard Admin Panel</title></head>
<body>
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
</body>
</html>
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

// ============================================================================
// FILESERVER (192.168.1.50)
// ============================================================================

const fileserverConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: '4a080e0e088d55294ab894a02b5c8e3f', userType: 'root', uid: 0 }, // b4ckup2024
    { username: 'ftpuser', passwordHash: 'be7a9d8e813210208cb7fba28717cda7', userType: 'user', uid: 1000 }, // tr4nsf3r
    { username: 'guest', passwordHash: '294de3557d9d00b3d2d8a1e6aab028cf', userType: 'guest', uid: 1001 }, // anonymous
  ],
  // HINT: FTP activity log
  varLogContent: {
    'vsftpd.log': {
      name: 'vsftpd.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'] },
      content: `Wed Mar 10 10:15:00 2024 [pid 1001] CONNECT: Client "192.168.1.100"
Wed Mar 10 10:15:02 2024 [pid 1001] [ftpuser] OK LOGIN: Client "192.168.1.100"
Wed Mar 10 10:15:10 2024 [pid 1001] [ftpuser] OK DOWNLOAD: Client "192.168.1.100", "/srv/ftp/public/readme.txt"
Wed Mar 10 10:20:00 2024 [pid 1002] [ftpuser] OK UPLOAD: Client "192.168.1.75", "/srv/ftp/uploads/db_dump.sql"
Thu Mar 11 02:00:00 2024 [pid 1010] CONNECT: Client "203.0.113.42"
Thu Mar 11 02:00:05 2024 [pid 1010] FAIL LOGIN: Client "203.0.113.42", user "anonymous"
`,
    },
  },
  extraDirectories: {
    srv: {
      name: 'srv',
      type: 'directory',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
      children: {
        ftp: {
          name: 'ftp',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user', 'guest'], write: ['root', 'user'] },
          children: {
            public: {
              name: 'public',
              type: 'directory',
              owner: 'root',
              permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
              children: {
                // HINT: FTP notice with ftpuser credentials
                'readme.txt': {
                  name: 'readme.txt',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
                  content: `=== FileServer FTP Service ===

Public downloads: /srv/ftp/public/
Uploads: /srv/ftp/uploads/ (authenticated users only)

Service accounts:
  guest    — anonymous read-only access
  ftpuser  — read/write (password: tr4nsf3r)

For admin access, contact root.
`,
                },
              },
            },
            uploads: {
              name: 'uploads',
              type: 'directory',
              owner: 'user',
              permissions: { read: ['root', 'user'], write: ['root', 'user'] },
              children: {
                // FLAG 7: Hidden backup notes
                '.backup_notes.txt': {
                  name: '.backup_notes.txt',
                  type: 'file',
                  owner: 'user',
                  permissions: { read: ['root', 'user'], write: ['root', 'user'] },
                  content: `Backup rotation schedule — DO NOT SHARE

FLAG{file_transfer_pro}

Note: Encrypted backup stored on webserver at /var/www/backups/
Encryption key was split — part 1 is in the webserver binary at /opt/tools/scanner
The key file will be needed for decryption.

Webserver SSH accepts default guest credentials.
`,
                },
              },
            },
            config: {
              name: 'config',
              type: 'directory',
              owner: 'root',
              permissions: { read: ['root', 'user'], write: ['root'] },
              children: {
                // Key part 2 for FLAG 9 decryption
                '.key_fragment': {
                  name: '.key_fragment',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root', 'user'], write: ['root'] },
                  content: `# Encryption key fragment (part 2 of 2)
# Combine with part 1 to get the full 64-character hex key

DECRYPT_KEY_PART2=ea2d996cb180258ec89c0000b42db460
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

// ============================================================================
// WEBSERVER (192.168.1.75)
// ============================================================================

// FLAG 8: Binary with embedded strings (flag + key part 1)
const scannerBinary =
  '\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00' +
  '\x02\x00>\x00\x01\x00\x00\x00\x80\x04\x40\x00\x00\x00\x00\x00' +
  '\x40\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00' +
  'scanner v2.3.1\x00' +
  '\x89\xe5\x48\x83\xec\x20\x00\x00\x00\x00\x00\x00' +
  'Usage: scanner [options] target\x00' +
  '\xb8\x01\x00\x00\x00\xbb\x00\x00\x00\x00\xcd\x80' +
  'FLAG{binary_secrets_revealed}\x00' +
  '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00' +
  'DECRYPT_KEY_PART1=76e2e21dacea215ff2293e4eafc5985c\x00' +
  '\x48\x89\xc7\xe8\x00\x00\x00\x00\x00\x00\x00\x00' +
  'See /var/www/backups/ for the encrypted file.\x00' +
  '\x00\x00\x00\x00' +
  'The second half of the key is in /srv/ftp/config/ on the fileserver.\x00' +
  '\xc3\x90\x90\x00\x00\x00\x00\x00';

// FLAG 9: Encrypted intel (AES-256-GCM)
// Full key: 76e2e21dacea215ff2293e4eafc5985cea2d996cb180258ec89c0000b42db460
// Decrypts to intelligence report with FLAG{decrypted_intel}
const encryptedIntel =
  'm4rFwweHGhShPmJxPq21pbiEKpauMZwWYVDKlDzFlUrhmem3Nqn4jVZ3ewxt43AQMRMPzDhvGm1e' +
  '5og/twV5xsgQUeUh/HjVVS9LZdFj3XwFJ7mKi5D/NMdX+j38v2LK4Kvnx0uzXwPoJX3jvsuR+1f' +
  'zce+s4i7+LaTAf3qHpVSyxYMdnHZt7h5z/o2+xKaXQYIko3GgMSFRip/ZKOdhHP1qGkvPwLrN07' +
  'LtHxAZ5YVGPzCF0Al0D9WfQC7Jy5vxSh5fCtseYLy+4n3I0byu1WpmGxJmyNkWepar8SJssz4Tp' +
  'aTUAPZwva/T9Obzw12GnqpG7SVMdgMT0LKw4GG3qryiNnYQGoILs2SAIkEbt7sxcmJSBrKO5i57' +
  'HRVaOhr7UsVJZ9QnMMV8fXz1tDBPvknYeAW8qQ6uh3FFh8uyrxqtWE4/rw==';

const webserverConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: 'a6f6c10dc3602b020c56ff49fb043ca9', userType: 'root', uid: 0 }, // r00tW3b!
    { username: 'www-data', passwordHash: 'd2d8d0cdf38ea5a54439ffadf7597722', userType: 'user', uid: 1000 }, // d3v0ps2024
    { username: 'guest', passwordHash: 'b2ce03aefab9060e1a42bd1aa1c571f6', userType: 'guest', uid: 1001 }, // w3lcome
  ],
  extraDirectories: {
    opt: {
      name: 'opt',
      type: 'directory',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
      children: {
        tools: {
          name: 'tools',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user'], write: ['root'] },
          children: {
            scanner: {
              name: 'scanner',
              type: 'file',
              owner: 'root',
              permissions: { read: ['root', 'user'], write: ['root'] },
              content: scannerBinary,
            },
            // FLAG 10: Backdoor log found via nc
            '.backdoor_log': {
              name: '.backdoor_log',
              type: 'file',
              owner: 'user',
              permissions: { read: ['root', 'user'], write: ['root'] },
              content: `FLAG{backdoor_found}

Backdoor installed by ghost@203.0.113.42
Connection log shows darknet.ctf:31337 as C2 server
The darknet web portal at port 8080 has login information.
`,
            },
            // HINT: Darknet SSH credentials (bonus path)
            '.darknet_access': {
              name: '.darknet_access',
              type: 'file',
              owner: 'user',
              permissions: { read: ['root', 'user'], write: ['root'] },
              content: `# Darknet SSH credentials (for maintenance)
Host: 203.0.113.42 (darknet.ctf)
User: guest
Pass: sh4d0w
`,
            },
          },
        },
      },
    },
    var: {
      name: 'var',
      type: 'directory',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
      children: {
        log: {
          name: 'log',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
          children: {
            // HINT: www-data credentials in access log (readable by guest)
            'access.log': {
              name: 'access.log',
              type: 'file',
              owner: 'root',
              permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
              content: `192.168.1.100 - - [10/Mar/2024:10:00:00 +0000] "GET / HTTP/1.1" 200 1234
192.168.1.100 - - [10/Mar/2024:10:00:05 +0000] "GET /admin HTTP/1.1" 403 567
192.168.1.1 - - [10/Mar/2024:12:30:00 +0000] "POST /api/login HTTP/1.1" 200 89
203.0.113.42 - - [11/Mar/2024:03:15:00 +0000] "GET /wp-admin HTTP/1.1" 404 0
203.0.113.42 - - [11/Mar/2024:03:15:05 +0000] "GET /.git/config HTTP/1.1" 200 234
`,
            },
            'error.log': {
              name: 'error.log',
              type: 'file',
              owner: 'root',
              permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
              content: `[error] MySQL connection failed: Access denied for user 'webapp'@'localhost'
[error] PHP Warning: include(/var/www/html/config.php): failed to open stream
[warn] mod_security: SQL injection attempt detected from 203.0.113.42
[notice] www-data console login: password 'd3v0ps2024' (audit mode enabled)
[error] Backup script failed — check /var/www/backups/
`,
            },
          },
        },
        www: {
          name: 'www',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
          children: {
            backups: {
              name: 'backups',
              type: 'directory',
              owner: 'root',
              permissions: { read: ['root', 'user'], write: ['root'] },
              children: {
                // FLAG 9: Encrypted file (requires key from scanner + fileserver)
                'encrypted_intel.enc': {
                  name: 'encrypted_intel.enc',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root', 'user'], write: ['root'] },
                  content: encryptedIntel,
                },
                // HINT: Database dump reveals root password
                'db_backup.sql': {
                  name: 'db_backup.sql',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root', 'user'], write: ['root'] },
                  content: `-- MySQL dump
-- Server version: 5.7.42
-- Database: production

CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50),
  password VARCHAR(255),
  role VARCHAR(20)
);

INSERT INTO users VALUES (1, 'admin', 'r00tW3b!', 'administrator');
INSERT INTO users VALUES (2, 'www-data', 'd3v0ps2024', 'service');
INSERT INTO users VALUES (3, 'guest', 'w3lcome', 'readonly');

CREATE TABLE sessions (
  token VARCHAR(255),
  user_id INT,
  expires DATETIME
);
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

// ============================================================================
// DARKNET (203.0.113.42)
// ============================================================================

// FLAG 12: Encrypted final flag (AES-256-GCM)
// Key: 82eab922d375a8022d7659b58559e59026dbff2768110073a6c3699a15699eda
// Decrypts to completion message with FLAG{master_of_the_darknet}
const encryptedFinalFlag =
  'XMnSrN8aYVwDjrjbXfpv5tKSigt/QuNwZCMVGFUNQCDa3nlUDX7y6lSjH2LkFjTGqsytTqsLikzm' +
  'zcFqcs40yArp7Ve2qq46m4RHqCf1DpA1IU9UofbXEpL07JhAJNrEOUYgHvsryOepgZrULnK3cJY2' +
  'Psi83f9Pwv3PXvSk3YllGlGvYeJXC1LXAHxjnWsGATPR5/0Ps5K3iblqQo3g9/OTAddGCJPYHku' +
  'XcUcZFyfxl/N/QzCx+A0elQH7sU6nOW3aK8WVRSu17kaD9J+1d3nI1GJ89sZtGY6QseffEcy7bp' +
  '1nT9X1jiKwn6a+eLTp/I26XiUc0DmhGNrszdfBFden3bhGqSIXopwSwRcUeuvmO+WQ5aKkpvCOgI' +
  '+4SmgbPJYEZd5Jvj8vqU06Y1J7utbtSJ5vs7Dy06m4oGA=';

// Ghost's home directory content
const ghostHome: Readonly<Record<string, FileNode>> = {
  '.encrypted_flag.enc': {
    name: '.encrypted_flag.enc',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'] },
    content: encryptedFinalFlag,
  },
  '.notes': {
    name: '.notes',
    type: 'file',
    owner: 'user',
    permissions: { read: ['root', 'user'], write: ['root', 'user'] },
    content: `The final flag is encrypted.
You need root to use decrypt().
The key is in /root/keyfile.txt.
Check the logs to find root's password.
`,
  },
};

const darknetConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: '63d7f708b7feb9c0494c64dbfb087f83', userType: 'root', uid: 0 }, // d4rkn3tR00t
    { username: 'ghost', passwordHash: 'd2aef0b37551aecfb067036d57f14930', userType: 'user', uid: 1000, homeContent: ghostHome }, // sp3ctr3
    { username: 'guest', passwordHash: 'e5ec4133db0a2e088310e8ecb0ee51d7', userType: 'guest', uid: 1001 }, // sh4d0w
  ],
  // Key for FLAG 12 decryption
  rootContent: {
    'keyfile.txt': {
      name: 'keyfile.txt',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: `# AES-256-GCM Decryption Key
# Use with: decrypt("/home/ghost/.encrypted_flag.enc", key)

82eab922d375a8022d7659b58559e59026dbff2768110073a6c3699a15699eda
`,
    },
  },
  // FLAG 11: Web content + API + HINT: auth.log with root password
  extraDirectories: {
    var: {
      name: 'var',
      type: 'directory',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
      children: {
        log: {
          name: 'log',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user'], write: ['root'] },
          children: {
            // HINT: Root password leaked in auth log (readable by ghost/user)
            'auth.log': {
              name: 'auth.log',
              type: 'file',
              owner: 'root',
              permissions: { read: ['root', 'user'], write: ['root'] },
              content: `Mar 10 00:00:00 darknet sshd[100]: Server started
Mar 10 00:00:01 darknet systemd: Starting encrypted services...
Mar 11 03:33:33 darknet sshd[200]: Accepted password for ghost from 192.168.1.75
Mar 12 06:00:00 darknet sshd[300]: Failed password for root from 10.0.0.1
Mar 12 06:00:01 darknet su[301]: pam_audit: root authentication - password 'd4rkn3tR00t' (audit logging enabled)
Mar 12 06:00:02 darknet su[301]: Successful su for root by ghost
Mar 13 12:00:00 darknet sshd[400]: Connection from 192.168.1.75 port 4444
`,
            },
            'messages': {
              name: 'messages',
              type: 'file',
              owner: 'root',
              permissions: { read: ['root', 'user'], write: ['root'] },
              content: `Mar 10 00:00:00 darknet kernel: System initialized
Mar 10 00:00:01 darknet systemd: Starting encrypted services...
Mar 11 03:33:33 darknet ???: VGhlIHNoYWRvd3Mga25vdyB5b3VyIG5hbWU=
Mar 11 03:33:34 darknet ???: Q29uZ3JhdHVsYXRpb25zIG9uIG1ha2luZyBpdCB0aGlzIGZhcg==
Mar 12 06:66:66 darknet ???: Connection from the void accepted
`,
            },
          },
        },
        www: {
          name: 'www',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
          children: {
            html: {
              name: 'html',
              type: 'directory',
              owner: 'user',
              permissions: { read: ['root', 'user', 'guest'], write: ['root', 'user'] },
              children: {
                'index.html': {
                  name: 'index.html',
                  type: 'file',
                  owner: 'user',
                  permissions: { read: ['root', 'user', 'guest'], write: ['root', 'user'] },
                  content: `<!DOCTYPE html>
<html>
<head><title>DARKNET</title></head>
<body style="background:#000;color:#0f0;font-family:monospace;">
<pre>
 ____    _    ____  _  ___   _ _____ _____
|  _ \\  / \\  |  _ \\| |/ / \\ | | ____|_   _|
| | | |/ _ \\ | |_) | ' /|  \\| |  _|   | |
| |_| / ___ \\|  _ <| . \\| |\\  | |___  | |
|____/_/   \\_\\_| \\_\\_|\\_\\_| \\_|_____| |_|

Welcome to the darknet. You shouldn't be here.

FLAG{darknet_discovered}

API endpoint: /api/secrets
Ghost in the machine: ghost/sp3ctr3
Backdoor service running on port 31337.
</pre>
</body>
</html>
`,
                },
              },
            },
            api: {
              name: 'api',
              type: 'directory',
              owner: 'root',
              permissions: { read: ['root', 'user'], write: ['root'] },
              children: {
                'secrets.json': {
                  name: 'secrets.json',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root', 'user'], write: ['root'] },
                  content: `{
  "message": "Welcome to the darknet API",
  "users": ["ghost", "root"],
  "hint": "ghost's home directory holds encrypted secrets",
  "note": "The root password is hidden in auth logs"
}`,
                },
              },
            },
          },
        },
      },
    },
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export type MachineId = 'localhost' | '192.168.1.1' | '192.168.1.50' | '192.168.1.75' | '203.0.113.42';

export const machineFileSystems: Readonly<Record<MachineId, FileNode>> = {
  'localhost': createFileSystem(localhostConfig),
  '192.168.1.1': createFileSystem(gatewayConfig),
  '192.168.1.50': createFileSystem(fileserverConfig),
  '192.168.1.75': createFileSystem(webserverConfig),
  '203.0.113.42': createFileSystem(darknetConfig),
};

export const getDefaultHomePath = (_machineId: string, username: string): string => {
  if (username === 'root') return '/root';
  return `/home/${username}`;
};
