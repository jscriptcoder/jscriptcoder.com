# JscriptCoder

A web-based JavaScript terminal emulator with a retro amber-on-black CRT aesthetic. Execute JavaScript expressions and custom commands in a terminal-like interface, featuring a virtual Unix-like file system and network simulation for CTF-style hacking puzzles.

**Live Demo:** [jscriptcoder.com](https://jscriptcoder.com)

## The Challenge

You start as a regular user on a machine connected to a network. Hidden throughout the system are **flags** - secret strings in the format `FLAG{...}` that prove you've successfully completed a challenge.

Your mission:
- **Explore** the local file system for clues
- **Escalate privileges** to access restricted areas
- **Discover** other machines on the network
- **Hack** your way into remote systems
- **Find all the flags**

Some flags are hidden in plain sight. Others require cracking passwords, exploiting misconfigurations, or pivoting through multiple machines. Use your knowledge of Linux commands, networking, and creative thinking to uncover them all.

Start with `help()` to see available commands. Good luck, hacker.

## Features

- **JavaScript Execution** - Run any JavaScript expression directly in the terminal
- **Command History** - Navigate previous commands with up/down arrows
- **Tab Autocompletion** - Complete commands and variables with Tab key
- **Variable Support** - Create variables with `const` and `let` declarations
- **Virtual Environment** - Explore a simulated system with secrets to uncover
- **Network Simulation** - Discover and hack into remote machines
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
| `ping(host, [count])` | Test connectivity to a network host |
| `nmap(target)` | Scan for open ports or discover hosts in a range |

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
ping("localhost")        // Test connectivity
```

## Network Simulation

Your machine is connected to a local network. You're not alone - there are other machines out there, each running different services and hiding their own secrets.

Use network reconnaissance commands to:
- Discover your network configuration
- Find other machines on the network
- Identify running services and open ports
- Connect to remote systems

The network holds flags waiting to be captured. Can you find them all?

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
