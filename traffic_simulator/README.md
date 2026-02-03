# Traffic Simulator

A TypeScript-based traffic simulator for the Course Platform API that uses Apache Bench to generate realistic user traffic patterns.

## Prerequisites

- **Docker Desktop** (Windows, macOS, Linux)
  - Windows: Install from https://www.docker.com/products/docker-desktop
  - macOS: Install from https://www.docker.com/products/docker-desktop
  - Linux: Install Docker Engine from your package manager
- **Backend services running** on port 3000 (see backend/README.md)

## Quick Start

```bash
cd traffic_simulator
npm start
```

This will:
1. Build the Docker image (cached after first build)
2. Run the load test with default settings (low load)
3. Display results in console

## Usage

### Default (Low Load)
```bash
npm start
```

### High Load
```bash
npm run docker:run:high
```

### Local Development (without Docker)
```bash
npm run start:local -- --load low
npm run start:local -- --load high --url http://localhost:3000
```

### Custom Docker Run
```bash
docker run --rm --add-host=host.docker.internal:host-gateway traffic-simulator:latest --load high --url http://host.docker.internal:3000
```

## CLI Options

- `-l, --load <level>` - Load level: `low` (1000 requests) or `high` (5000 requests). Default: `low`
- `-u, --url <url>` - Base URL of the API. Default: `http://host.docker.internal:3000` (Docker), `http://localhost:3000` (local)
- `-h, --help` - Show help

## Windows Support

### Why Docker?

On Windows, Apache Bench (ab) is not easily available and typically requires Cygwin or WSL. This Docker-based approach provides:
- No Apache Bench installation required
- Consistent behavior across Windows, macOS, and Linux
- Simple `npm start` command

### Windows Setup

1. Install Docker Desktop for Windows
2. Start Docker Desktop (ensure it's running)
3. Ensure backend is running on port 3000
4. Run `npm start` in PowerShell, Command Prompt, or Git Bash

### Windows Troubleshooting

**Issue**: "Docker is not running" error

**Solution**: Start Docker Desktop and wait for it to fully initialize

**Issue**: "Cannot connect to backend" error

**Solution**:
- Verify backend is running: `curl http://localhost:3000/health`
- Check Docker Desktop settings → Resources → Network
- Try running backend with `docker compose up` in backend directory

## How It Works

1. **Phase 1 - Setup**: Creates 10 test users via API (registers and logs in)
2. **Phase 2 - Load Generation**: Runs Apache Bench with different traffic patterns:
   - Browse courses (40%)
   - View course details (30%)
   - User authentication (15%)
   - Enroll in courses (10%)
   - User dashboard (5%)
3. **Results**: Displays success rate, RPS, and duration for each pattern

## Monitoring

View real-time metrics in Grafana:

**http://localhost:3001**

## Architecture

```
Docker Container (traffic-simulator)
├── Node.js 20 Alpine
├── TypeScript + ts-node
├── Apache Bench (ab command)
└── Network: host.docker.internal → Host machine
    └── Backend on port 3000
```

## Troubleshooting

### Build Issues

**Issue**: "docker build failed"

**Solution**:
```bash
# Clean up and rebuild
docker rmi traffic-simulator:latest
npm start
```

### Connection Issues

**Issue**: "Backend is not accessible"

**Solution**:
1. Verify backend is running:
   ```bash
   curl http://localhost:3000/health
   ```
2. If using Docker backend, ensure it's accessible on host:
   ```bash
   docker ps  # Check gateway service is running
   ```

### Permission Issues (Linux)

**Issue**: "Permission denied" when running npm start

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

## Development

### Project Structure

```
traffic_simulator/
├── src/
│   ├── index.ts       # CLI entry point
│   ├── simulator.ts   # Main simulator logic
│   ├── flows.ts       # Traffic flow definitions
│   └── types.ts       # TypeScript types
├── Dockerfile         # Docker image definition
├── package.json       # npm scripts and dependencies
└── README.md         # This file
```

### npm Scripts

- `npm start` - Build and run Docker container (recommended)
- `npm run start:local` - Run locally without Docker (requires `ab` installed)
- `npm run docker:build` - Build Docker image only
- `npm run docker:run` - Run container with low load
- `npm run docker:run:high` - Run container with high load
- `npm run docker:run:help` - Show CLI help
