# JscriptCoder

A web-based JavaScript terminal emulator with a retro amber-on-black CRT aesthetic. Execute JavaScript expressions and custom commands in a terminal-like interface, featuring a virtual Unix-like file system with permissions for CTF-style hacking puzzles.

**Live Demo:** [jscriptcoder.com](https://jscriptcoder.com)

## Features

- **JavaScript Execution** - Run any JavaScript expression directly in the terminal
- **Command History** - Navigate previous commands with up/down arrows
- **Tab Autocompletion** - Complete commands and variables with Tab key
- **Variable Support** - Create variables with `const` and `let` declarations
- **Virtual File System** - Unix-like directory structure with permission system
- **Network Simulation** - Simulated network with discoverable machines and services
- **Retro CRT Theme** - Classic amber-on-black terminal aesthetic

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/jscriptcoder/jscriptcoder.git
cd jscriptcoder

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Commands

| Command | Description |
|---------|-------------|
| `help()` | List all available commands |
| `man(cmd)` | Display detailed manual for a command |
| `echo(value)` | Output a stringified value |
| `author()` | Display author profile card |
| `clear()` | Clear the terminal screen |
| `pwd()` | Print current working directory |
| `ls([path])` | List directory contents |
| `cd([path])` | Change current directory |
| `cat(path)` | Display file contents |
| `su(user)` | Switch user (prompts for password) |
| `whoami()` | Display current username |
| `ifconfig([iface])` | Display network interface configuration |

### Examples

```javascript
// Basic JavaScript
2 + 2                    // => 4
Math.sqrt(16)            // => 4

// Variables
const name = "World"
echo("Hello " + name)    // => Hello World

// File system
ls()                     // List current directory
cd("/etc")               // Change to /etc
cat("passwd")            // View file contents

// Help
man("ls")                // Show manual for ls command

// Switch user (will prompt for password)
su("root")               // Attempt to switch to root

// Network
ifconfig()               // Show network interfaces
whoami()                 // Display current user
```

## Virtual File System

The terminal includes a virtual Unix-like file system with permissions:

```
/
├── root/              # Root user home (restricted)
├── home/
│   ├── jscriptcoder/  # Default user home
│   └── guest/         # Guest user home
├── etc/
│   └── passwd         # User passwords
├── var/
│   └── log/           # Log files
└── tmp/               # Temporary files (world writable)
```

**User Types:**
- `root` - Full access to everything
- `user` - Access to home directory and shared files
- `guest` - Limited access

## Network Simulation

The terminal simulates a local network with discoverable machines:

```
192.168.1.0/24 Network
├── 192.168.1.1   (gateway)    - Router
├── 192.168.1.50  (fileserver) - FTP/SSH server
├── 192.168.1.75  (webserver)  - Web/MySQL server
└── 192.168.1.100 (localhost)  - Your machine
```

Use `ifconfig()` to view your network configuration and discover the gateway IP.

## Development

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── components/Terminal/    # Terminal UI components
├── context/                # React contexts (Session)
├── filesystem/             # Virtual file system
├── network/                # Network simulation
├── hooks/                  # Custom React hooks
├── commands/               # Terminal commands
└── App.tsx                 # Root component
```

## Deployment

The project is configured for Vercel deployment. Push to the `main` branch to trigger automatic deployment.

## License

MIT
