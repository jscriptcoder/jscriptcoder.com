import type { FileNode } from './types';
import { createFileSystem, type MachineFileSystemConfig } from './fileSystemFactory';

// Helper to safely get a child node from a FileNode
// The factory always creates these, but TypeScript doesn't know that
const getChildNode = (parent: FileNode, name: string): FileNode => {
  const child = parent.children?.[name];
  if (!child) {
    throw new Error(`Expected child node '${name}' not found`);
  }
  return child;
};

// ============================================================================
// LOCALHOST (192.168.1.100)
// ============================================================================

const localhostConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: 'a0ff67e77425eb3cea40ecb60941aea4', userType: 'root', uid: 0 }, // sup3rus3r
    { username: 'jshacker', passwordHash: '25cd52d0d5975297e6c28700caa9dd72', userType: 'user', uid: 1000 }, // h4ckth3pl4n3t
    { username: 'guest', passwordHash: '0fb9cbecb7b8881511c69c39db643e8c', userType: 'guest', uid: 1001 }, // guestpass
  ],
  rootContent: {
    '.secret': {
      name: '.secret',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: 'FLAG{welcome_to_the_underground}',
    },
  },
  varLogContent: {},
};

// Add jshacker's home content after config
const localhostFs = createFileSystem(localhostConfig);
const localhostHome = getChildNode(localhostFs, 'home');
const localhostWithHome: FileNode = {
  ...localhostFs,
  children: {
    ...localhostFs.children,
    home: {
      ...localhostHome,
      children: {
        ...localhostHome.children,
        jshacker: {
          name: 'jshacker',
          type: 'directory',
          owner: 'user',
          permissions: { read: ['root', 'user'], write: ['root', 'user'] },
          children: {
            'secret.enc': {
              name: 'secret.enc',
              type: 'file',
              owner: 'user',
              permissions: { read: ['root', 'user'], write: ['root', 'user'] },
              content: '/NTX70iRuQttx+h+zK4kbsNlRM+vkGk07eM5j4KBNmbHq/juVGubEKS5wZl+p77Ep1fsQ0mefe27gXEAXtVCyR5aFCRJt21JcGiczh1svRwRisoJJqHKs0ce9Xbu6iqvtoaXv/T+n1gg',
            },
            'keyfile.txt': {
              name: 'keyfile.txt',
              type: 'file',
              owner: 'user',
              permissions: { read: ['root', 'user'], write: ['root', 'user'] },
              content: `# Decryption Key
# Use with: decrypt("secret.enc", "<key>")

75076c2646b146bc33de447f3aba8c8803a2f9f6a8fef4de74b7fab1cfb2c4da
`,
            },
            'readme.txt': {
              name: 'readme.txt',
              type: 'file',
              owner: 'user',
              permissions: { read: ['root', 'user'], write: ['root', 'user'] },
              content: `# Welcome to JSHACK.ME

You are a hacker on a machine connected to a network.
Your mission is to find all the hidden FLAGS.

## Rules

- Flags are in the format: FLAG{...}
- Some flags are on this machine, others are on remote systems
- You'll need to escalate privileges and pivot through the network
- Use your knowledge of Linux, networking, and hacking

## Getting Started

1. Explore the file system with ls() and cd()
2. Check your network configuration with ifconfig()
3. Discover other machines with ping() and nmap()
4. Crack passwords, exploit misconfigurations, find the flags

## Hints

- The /etc directory often contains useful information
- Hidden files start with a dot (use ls("-a") to see them)
- Weak passwords can be cracked with rainbow tables

Good luck, hacker.
`,
            },
          },
        },
      },
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
    '.router_backup': {
      name: '.router_backup',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: `# Router Configuration Backup
# Last modified: 2024-03-15

SSID=NETGEAR-5G
WPA_KEY=FLAG{router_misconfiguration}

# Port forwarding rules
# 22 -> 192.168.1.50 (fileserver)
# 80 -> 192.168.1.75 (webserver)
`,
    },
  },
  varLogContent: {},
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
            'auth.log': {
              name: 'auth.log',
              type: 'file',
              owner: 'root',
              permissions: { read: ['root', 'user'], write: ['root'] },
              content: `Mar 10 08:15:22 gateway sshd[1234]: Failed password for admin from 192.168.1.100
Mar 10 08:15:25 gateway sshd[1234]: Failed password for admin from 192.168.1.100
Mar 10 09:30:01 gateway sshd[1235]: Accepted password for admin from 10.0.0.5
Mar 11 14:22:10 gateway sshd[1240]: Failed password for root from 203.0.113.42
Mar 11 14:22:15 gateway sshd[1240]: Failed password for root from 203.0.113.42
Mar 12 03:00:00 gateway sshd[1250]: Connection from 192.168.1.50 port 22
Mar 12 03:00:05 gateway sshd[1250]: Accepted publickey for admin
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
<head><title>Router Admin Panel</title></head>
<body>
<h1>NETGEAR Gateway</h1>
<p>Firmware: v2.1.3</p>
<p>Status: Online</p>
<!-- Admin login: /admin.html -->
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
<head><title>Admin Panel</title></head>
<body>
<h1>Router Administration</h1>
<p>Firewall: Disabled</p>
<p>Port Forwarding: Enabled</p>
<p>FLAG{router_admin_panel}</p>
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
  rootContent: {
    '.bash_history': {
      name: '.bash_history',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: `cd /srv/ftp
ls -la
cat backup_credentials.txt
rm backup_credentials.txt
ssh admin@192.168.1.1
`,
    },
  },
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
                'readme.txt': {
                  name: 'readme.txt',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
                  content: `Welcome to the FTP server.
Public files are available here.

For private uploads, use /srv/ftp/uploads
Contact: admin@fileserver.local
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
                '.hidden_backup.tar.gz': {
                  name: '.hidden_backup.tar.gz',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root'], write: ['root'] },
                  content: 'FLAG{ftp_hidden_treasure}',
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

const webserverConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: 'a6f6c10dc3602b020c56ff49fb043ca9', userType: 'root', uid: 0 }, // r00tW3b!
    { username: 'www-data', passwordHash: 'd2d8d0cdf38ea5a54439ffadf7597722', userType: 'user', uid: 1000 }, // d3v0ps2024
    { username: 'guest', passwordHash: 'b2ce03aefab9060e1a42bd1aa1c571f6', userType: 'guest', uid: 1001 }, // w3lcome
  ],
  rootContent: {
    '.mysql_history': {
      name: '.mysql_history',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: `SELECT * FROM users;
UPDATE users SET password='admin123' WHERE username='admin';
SELECT * FROM secrets;
INSERT INTO secrets VALUES ('FLAG{sql_history_exposed}');
`,
    },
  },
  varLogContent: {
    'access.log': {
      name: 'access.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'] },
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
      permissions: { read: ['root', 'user'], write: ['root'] },
      content: `[error] MySQL connection failed: Access denied for user 'webapp'@'localhost'
[error] PHP Warning: include(/var/www/html/config.php): failed to open stream
[warn] mod_security: SQL injection attempt detected from 203.0.113.42
[error] Database backup failed - check /var/www/backups/db_backup.sql
`,
    },
  },
  extraDirectories: {
    bin: {
      name: 'bin',
      type: 'directory',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
      children: {
        'sudo': {
          name: 'sudo',
          type: 'file',
          owner: 'root',
          permissions: { read: ['root', 'user', 'guest'], write: ['root'] },
          // Binary file with embedded strings - use strings() to extract
          content: '\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00' +
            '\x02\x00>\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00' +
            'BACKDOOR_PASS=r00tk1t\x00\x00\x00' +
            '\x89\xe5\x83\xec\x10\x00\x00\x00\x00' +
            '/bin/sh\x00\x00\x00' +
            '\xcd\x80\x00\x00\x00\x00\x00\x00' +
            'FLAG{binary_backdoor_detected}\x00\x00' +
            '\x00\x00\x00\x00\x00\x00\x00\x00',
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
          permissions: { read: ['root', 'user'], write: ['root'] },
          children: {}, // Will be merged from varLogContent
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
<head><title>Welcome</title></head>
<body>
<h1>Webserver</h1>
<p>Nothing to see here...</p>
<!-- TODO: Remove debug config before production -->
</body>
</html>
`,
                },
                'config.php': {
                  name: 'config.php',
                  type: 'file',
                  owner: 'user',
                  permissions: { read: ['root', 'user'], write: ['root', 'user'] },
                  content: `<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'webapp');
define('DB_PASS', 'W3bApp_S3cr3t!');
define('DB_NAME', 'production');

// Debug mode - DISABLE IN PRODUCTION
define('DEBUG', true);
?>
`,
                },
              },
            },
            backups: {
              name: 'backups',
              type: 'directory',
              owner: 'root',
              permissions: { read: ['root'], write: ['root'] },
              children: {
                'db_backup.sql': {
                  name: 'db_backup.sql',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root'], write: ['root'] },
                  content: `-- MySQL dump
-- Database: production

CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50),
  password VARCHAR(255)
);

INSERT INTO users VALUES (1, 'admin', 'FLAG{database_backup_gold}');
INSERT INTO users VALUES (2, 'guest', 'guest123');
`,
                },
              },
            },
            api: {
              name: 'api',
              type: 'directory',
              owner: 'user',
              permissions: { read: ['root', 'user', 'guest'], write: ['root', 'user'] },
              children: {
                'users.json': {
                  name: 'users.json',
                  type: 'file',
                  owner: 'user',
                  permissions: { read: ['root', 'user', 'guest'], write: ['root', 'user'] },
                  content: `{
  "users": [
    {"id": 1, "username": "admin", "role": "administrator"},
    {"id": 2, "username": "www-data", "role": "service"},
    {"id": 3, "username": "guest", "role": "guest"}
  ]
}`,
                },
                'config.json': {
                  name: 'config.json',
                  type: 'file',
                  owner: 'user',
                  permissions: { read: ['root', 'user'], write: ['root'] },
                  content: `{
  "database": {
    "host": "localhost",
    "user": "webapp",
    "password": "W3bApp_S3cr3t!"
  },
  "debug": true,
  "flag": "FLAG{api_config_exposed}"
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

// Merge webserver var with generated var/log and add bin
const webserverFs = createFileSystem(webserverConfig);
const webserverWithVar: FileNode = {
  ...webserverFs,
  children: {
    ...webserverFs.children,
    bin: webserverConfig.extraDirectories?.bin as FileNode,
    var: {
      ...(webserverConfig.extraDirectories?.var as FileNode),
      children: {
        ...(webserverConfig.extraDirectories?.var as FileNode).children,
        log: {
          name: 'log',
          type: 'directory',
          owner: 'root',
          permissions: { read: ['root', 'user'], write: ['root'] },
          children: webserverConfig.varLogContent ?? {},
        },
      },
    },
  },
};

// ============================================================================
// DARKNET (203.0.113.42)
// ============================================================================

const darknetConfig: MachineFileSystemConfig = {
  users: [
    { username: 'root', passwordHash: '63d7f708b7feb9c0494c64dbfb087f83', userType: 'root', uid: 0 }, // d4rkn3tR00t
    { username: 'ghost', passwordHash: 'd2aef0b37551aecfb067036d57f14930', userType: 'user', uid: 1000 }, // sp3ctr3
    { username: 'guest', passwordHash: 'e5ec4133db0a2e088310e8ecb0ee51d7', userType: 'guest', uid: 1001 }, // sh4d0w
  ],
  rootContent: {
    'FINAL_FLAG.txt': {
      name: 'FINAL_FLAG.txt',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root'], write: ['root'] },
      content: `Congratulations, you've reached the end.

FLAG{master_of_the_darknet}

You have demonstrated:
- Network reconnaissance
- Password cracking
- Privilege escalation
- Lateral movement

The shadows welcome you.
`,
    },
  },
  varLogContent: {},
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
<head><title>Welcome to the Darknet</title></head>
<body style="background:#000;color:#0f0;font-family:monospace;">
<h1>ACCESS GRANTED</h1>
<pre>
 ____             _    _   _      _
|  _ \\  __ _ _ __| | _| \\ | | ___| |_
| | | |/ _\` | '__| |/ /  \\| |/ _ \\ __|
| |_| | (_| | |  |   <| |\\  |  __/ |_
|____/ \\__,_|_|  |_|\\_\\_| \\_|\\___|\\__|
</pre>
<p>The shadows know your name.</p>
<p>Hint: POST to /api/secrets for more...</p>
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
  "message": "You found the darknet API",
  "encoded": "VGhlIGZpbmFsIGZsYWcgaXMgd2l0aCByb290",
  "hint": "Root's password is a common word",
  "flag": "FLAG{darknet_api_discovered}"
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

const darknetFs = createFileSystem(darknetConfig);
const darknetHome = getChildNode(darknetFs, 'home');
const darknetWithHome: FileNode = {
  ...darknetFs,
  children: {
    ...darknetFs.children,
    home: {
      ...darknetHome,
      children: {
        ...darknetHome.children,
        ghost: {
          name: 'ghost',
          type: 'directory',
          owner: 'user',
          permissions: { read: ['root', 'user'], write: ['root', 'user'] },
          children: {
            '.secrets': {
              name: '.secrets',
              type: 'directory',
              owner: 'user',
              permissions: { read: ['root', 'user'], write: ['root', 'user'] },
              children: {
                'hint.txt': {
                  name: 'hint.txt',
                  type: 'file',
                  owner: 'user',
                  permissions: { read: ['root', 'user'], write: ['root', 'user'] },
                  content: `The final flag lies with root.
But root's password is weak...
Just like all the others.

Hint: It's a common word.
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
// EXPORTS
// ============================================================================

export type MachineId = 'localhost' | '192.168.1.1' | '192.168.1.50' | '192.168.1.75' | '203.0.113.42';

export const machineFileSystems: Readonly<Record<MachineId, FileNode>> = {
  'localhost': localhostWithHome,
  '192.168.1.1': createFileSystem(gatewayConfig),
  '192.168.1.50': createFileSystem(fileserverConfig),
  '192.168.1.75': webserverWithVar,
  '203.0.113.42': darknetWithHome,
};

export const getDefaultHomePath = (_machineId: string, username: string): string => {
  if (username === 'root') return '/root';
  return `/home/${username}`;
};
