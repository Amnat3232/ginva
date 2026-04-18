# Ginva Protocol - Docker Build Guide

## Summary

Docker solves **Build Toolchain Compatibility** issues by providing a ready environment:

- ✅ Rust 1.79 (compatible with edition2024)
- ✅ Solana CLI 1.18.26
- ✅ Anchor CLI 0.32.1
- ✅ Node.js 20
- ✅ All required dependencies

## Usage Steps

### 1. Install Docker (if not already installed)

**macOS:**

```bash
# Download Docker Desktop
open https://www.docker.com/products/docker-desktop

# Or use Homebrew
brew install --cask docker
```

**Linux (Ubuntu/Debian):**

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group (must logout/login)
sudo usermod -aG docker $USER

# Install docker-compose
sudo apt-get install docker-compose-plugin
```

**Windows:**

- Download Docker Desktop: https://www.docker.com/products/docker-desktop

### 2. Verify Installation

```bash
# Check Docker
docker --version
# Should show: Docker version 24.x.x or higher

# Check Docker Compose
docker-compose --version
# or
docker compose version
# Should show: v2.x.x or higher

# Check if Docker is running
docker info
```

### 3. Start Build

#### Method 1: Interactive Script (Recommended)

```bash
# Make script executable
chmod +x docker-build.sh

# Run script
./docker-build.sh
```

**Menu that will appear:**

```
Select operation:

1) 🔨 Build program
2) 🧪 Run tests
3) 🐚 Enter shell for manual commands
4) 🚀 Deploy to devnet
5) 🧹 Clean build cache
6) 📊 View logs
7) ❌ Exit
```

#### Method 2: Use NPM Scripts

```bash
# Build
npm run build:docker

# Run tests
npm run test:docker

# Enter shell
npm run docker:shell

# Deploy to devnet
docker-compose up --build deploy-devnet

# Clean cache
npm run docker:clean
```

#### Method 3: Use Docker Compose Directly

```bash
# Build
docker-compose up --build build

# Or if using Docker Compose V2
docker compose up --build build

# Run tests
docker-compose up --build test

# Enter shell
docker-compose run --rm shell
```

## Common Commands

### Build Program

```bash
# Method 1: via script
./docker-build.sh
# Select 1

# Method 2: via npm
npm run build:docker

# Method 3: docker-compose
make build
# or
make docker-build
```

### Run Tests

```bash
./docker-build.sh
# Select 2

# or
npm run test:docker
```

### Deploy to Devnet

```bash
./docker-build.sh
# Select 4

# or
docker-compose up --build deploy-devnet
```

**Important:** Before deploying, must have wallet at `~/.config/solana/id.json`

Create wallet:

```bash
# On host machine (not in Docker)
solana-keygen new

# Request airdrop (devnet)
solana airdrop 2
```

### Enter Shell for Manual Use

```bash
./docker-build.sh
# Select 3

# In shell, can use commands:
anchor build
anchor test
anchor deploy --provider.cluster devnet
anchor keys sync
solana --version
```

Exit shell:

```bash
exit
```

### Clean Build Cache

```bash
./docker-build.sh
# Select 5

# or
npm run docker:clean
```

## Docker Structure

### Services Available

1. **build** - Build program
2. **test** - Run tests
3. **shell** - Interactive shell
4. **deploy-devnet** - Deploy to devnet

### Volumes (Persistent Data)

- **cargo-cache** - Cargo registry cache (no reload each time)
- **solana-cache** - Solana CLI cache
- **target-cache** - Build artifacts

## Troubleshooting

### 1. Docker daemon not running

```
❌ Docker daemon is not running
```

**Fix:**

```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker

# Windows
# Open Docker Desktop
```

### 2. Permission denied

```
permission denied while trying to connect to Docker daemon
```

**Fix (Linux):**

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
# or
newgrp docker
```

### 3. Build Slow / Stuck

**Cause:** First time must download Docker image and dependencies

**Fix:**

```
# Wait (may take 10-30 minutes on first run)
# Next time will be much faster due to cache

# View progress
./docker-build.sh
# Select 6 (View logs)
```

### 4. Out of memory

**Fix:**

```bash
# Increase memory limit for Docker
# Docker Desktop > Settings > Resources > Memory
# Recommended: 4GB or higher
```

### 5. Network issues

```
error: failed to download crate
```

**Fix:**

```bash
# Check internet connection
ping google.com

# Run again
./docker-build.sh
```

### 6. Want to rebuild from scratch

```bash
# Clean everything
./docker-build.sh
# Select 5

# or manually
docker-compose down -v
docker system prune -a
```

## Comparison: Docker vs Native Build

| Feature         | Docker                   | Native                                |
| --------------- | ------------------------ | ------------------------------------- |
| Setup           | Easy (just install Docker) | Hard (must manage Rust, Solana, Anchor) |
| Build Time      | Slightly slower          | Faster                                |
| Consistency     | ✅ 100% consistent       | May have version issues               |
| Cross-platform  | ✅ Works on all OS       | More difficult                        |
| Toolchain Issue | ✅ Solved                | ❌ Has edition2024 issues             |

## Tips & Tricks

### 1. Use VS Code Dev Containers

If using VS Code, can develop in Docker container directly:

```bash
# Install extension: Remote - Containers
# Press F1 > "Remote-Containers: Reopen in Container"
```

### 2. Parallel Development

```bash
# Terminal 1: Run build
npm run build:docker

# Terminal 2: Enter shell for other tasks
npm run docker:shell
```

### 3. Save Build Time

```bash
# First build (slow)
./docker-build.sh  # Select 1

# Next time (fast - uses cache)
./docker-build.sh  # Select 1
```

### 4. Custom Commands

```bash
# Run any command in Docker
docker-compose run --rm shell anchor keys list

docker-compose run --rm shell solana balance

docker-compose run --rm shell cargo --version
```

## Important Commands Summary

```bash
# Start - Build program
./docker-build.sh  # Select 1

# Run tests
./docker-build.sh  # Select 2

# Deploy
./docker-build.sh  # Select 4

# Enter shell
./docker-build.sh  # Select 3

# Clean cache
./docker-build.sh  # Select 5

# View logs
./docker-build.sh  # Select 6
```

Or use npm scripts:

```bash
npm run build:docker   # Build
npm run test:docker    # Test
npm run docker:shell   # Shell
npm run docker:clean   # Clean
```

## Contact & Support

- **GitHub Issues**: For bug reports
- **Discord**: For general questions

---

**Note:** If you don't want to use Docker, downgrade to Anchor 0.29.0 instead (contact team for that branch)