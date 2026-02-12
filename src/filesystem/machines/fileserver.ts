import type { FileNode } from '../types';
import { createFileSystem, type MachineFileSystemConfig } from '../fileSystemFactory';

const fileserverConfig: MachineFileSystemConfig = {
  users: [
    {
      username: 'root',
      passwordHash: '4a080e0e088d55294ab894a02b5c8e3f',
      userType: 'root',
      uid: 0,
    }, // b4ckup2024
    {
      username: 'ftpuser',
      passwordHash: 'be7a9d8e813210208cb7fba28717cda7',
      userType: 'user',
      uid: 1000,
    }, // tr4nsf3r
    {
      username: 'guest',
      passwordHash: '294de3557d9d00b3d2d8a1e6aab028cf',
      userType: 'guest',
      uid: 1001,
    }, // anonymous
  ],
  etcExtraContent: {
    hostname: {
      name: 'hostname',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user', 'guest'], write: ['root'], execute: ['root'] },
      content: 'fileserver\n',
    },
    'vsftpd.conf': {
      name: 'vsftpd.conf',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `# vsftpd configuration file
listen=YES
listen_port=21
anonymous_enable=YES
local_enable=YES
write_enable=YES
anon_root=/srv/ftp/public
local_root=/srv/ftp
chroot_local_user=YES
pasv_enable=YES
pasv_min_port=10000
pasv_max_port=10100
xferlog_enable=YES
xferlog_file=/var/log/vsftpd.log
`,
    },
  },
  // HINT: FTP activity log
  varLogContent: {
    'vsftpd.log': {
      name: 'vsftpd.log',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Wed Mar 10 10:15:00 2024 [pid 1001] CONNECT: Client "192.168.1.100"
Wed Mar 10 10:15:02 2024 [pid 1001] [ftpuser] OK LOGIN: Client "192.168.1.100"
Wed Mar 10 10:15:10 2024 [pid 1001] [ftpuser] OK DOWNLOAD: Client "192.168.1.100", "/srv/ftp/public/readme.txt"
Wed Mar 10 10:20:00 2024 [pid 1002] [ftpuser] OK UPLOAD: Client "192.168.1.75", "/srv/ftp/uploads/db_dump.sql"
Thu Mar 11 02:00:00 2024 [pid 1010] CONNECT: Client "203.0.113.42"
Thu Mar 11 02:00:05 2024 [pid 1010] FAIL LOGIN: Client "203.0.113.42", user "anonymous"
`,
    },
    syslog: {
      name: 'syslog',
      type: 'file',
      owner: 'root',
      permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
      content: `Mar 10 08:00:00 fileserver systemd[1]: Starting vsftpd FTP server...
Mar 10 08:00:01 fileserver vsftpd[890]: Listening on port 21
Mar 10 08:00:02 fileserver systemd[1]: Started vsftpd FTP server.
Mar 10 08:00:05 fileserver systemd[1]: Starting OpenSSH server...
Mar 10 08:00:06 fileserver systemd[1]: Started OpenSSH server.
Mar 11 04:00:00 fileserver CRON[2100]: (root) CMD (/usr/bin/find /srv/ftp/uploads -mtime +30 -delete)
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
            write: ['root', 'user'],
            execute: ['root', 'user', 'guest'],
          },
          children: {
            public: {
              name: 'public',
              type: 'directory',
              owner: 'root',
              permissions: {
                read: ['root', 'user', 'guest'],
                write: ['root'],
                execute: ['root', 'user', 'guest'],
              },
              children: {
                // HINT: FTP notice with ftpuser credentials
                'readme.txt': {
                  name: 'readme.txt',
                  type: 'file',
                  owner: 'root',
                  permissions: {
                    read: ['root', 'user', 'guest'],
                    write: ['root'],
                    execute: ['root'],
                  },
                  content: `=== FileServer FTP Service ===

Public downloads: /srv/ftp/public/
Uploads: /srv/ftp/uploads/ (authenticated users only)

Service accounts:
  guest    — anonymous read-only access
  ftpuser  — read/write (password: tr4nsf3r)

For admin access, contact root.
`,
                },
                'CHANGELOG.txt': {
                  name: 'CHANGELOG.txt',
                  type: 'file',
                  owner: 'root',
                  permissions: {
                    read: ['root', 'user', 'guest'],
                    write: ['root'],
                    execute: ['root'],
                  },
                  content: `FileServer CHANGELOG
====================

v2.1.0 (2024-03-01)
  - Upgraded vsftpd to 3.0.5
  - Added passive mode support
  - Increased upload limit to 100MB

v2.0.0 (2024-01-15)
  - Migrated from ProFTPD to vsftpd
  - New directory structure (/srv/ftp)
  - Added anonymous access for public/

v1.0.0 (2023-06-01)
  - Initial deployment
  - Basic FTP with local users only
`,
                },
              },
            },
            uploads: {
              name: 'uploads',
              type: 'directory',
              owner: 'user',
              permissions: {
                read: ['root', 'user'],
                write: ['root', 'user'],
                execute: ['root', 'user'],
              },
              children: {
                // FLAG 7: Hidden backup notes
                '.backup_notes.txt': {
                  name: '.backup_notes.txt',
                  type: 'file',
                  owner: 'user',
                  permissions: {
                    read: ['root', 'user'],
                    write: ['root', 'user'],
                    execute: ['root'],
                  },
                  content: `Backup rotation schedule — DO NOT SHARE

FLAG{file_transfer_pro}

Note: Encrypted backup stored on webserver at /var/www/backups/
Encryption key was split — part 1 is in the webserver binary at /opt/tools/scanner
The key file will be needed for decryption.

Webserver SSH accepts default guest credentials.
`,
                },
                'meeting_notes_2024.txt': {
                  name: 'meeting_notes_2024.txt',
                  type: 'file',
                  owner: 'user',
                  permissions: {
                    read: ['root', 'user'],
                    write: ['root', 'user'],
                    execute: ['root'],
                  },
                  content: `Team Standup — March 2024
=========================

Attendees: admin, www-data, ftpuser

Action Items:
- [admin] Review firewall rules on gateway
- [www-data] Deploy new portal update by Friday
- [ftpuser] Clean up old uploads directory
- [admin] Schedule quarterly password rotation
- [www-data] Fix Apache config warnings

Next meeting: April 1, 2024
`,
                },
                'tmp_data.csv': {
                  name: 'tmp_data.csv',
                  type: 'file',
                  owner: 'user',
                  permissions: {
                    read: ['root', 'user'],
                    write: ['root', 'user'],
                    execute: ['root'],
                  },
                  content: `timestamp,source_ip,dest_ip,bytes,protocol
2024-03-10T10:00:00,192.168.1.100,192.168.1.75,4520,TCP
2024-03-10T10:05:00,192.168.1.75,192.168.1.50,12800,TCP
2024-03-10T10:10:00,192.168.1.1,192.168.1.100,890,ICMP
2024-03-10T10:15:00,203.0.113.42,192.168.1.75,33200,TCP
2024-03-10T10:20:00,192.168.1.50,192.168.1.1,1200,TCP
`,
                },
              },
            },
            config: {
              name: 'config',
              type: 'directory',
              owner: 'root',
              permissions: {
                read: ['root', 'user'],
                write: ['root'],
                execute: ['root', 'user'],
              },
              children: {
                // Key part 2 for FLAG 9 decryption
                '.key_fragment': {
                  name: '.key_fragment',
                  type: 'file',
                  owner: 'root',
                  permissions: { read: ['root', 'user'], write: ['root'], execute: ['root'] },
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

export const fileserver: FileNode = createFileSystem(fileserverConfig);
