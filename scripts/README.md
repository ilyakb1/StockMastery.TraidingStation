# Trading Station Test Scripts

This directory contains scripts for running end-to-end tests with Docker containers.

## Scripts

### run-e2e-tests.ps1 (Windows)
PowerShell script to run complete E2E test suite with Docker.

**Usage**:
```powershell
# Run tests (with cleanup)
.\run-e2e-tests.ps1

# Run tests without cleanup (keeps containers running)
.\run-e2e-tests.ps1 -NoCleanup

# Run tests with browser visible
.\run-e2e-tests.ps1 -Headed

# Combined options
.\run-e2e-tests.ps1 -NoCleanup -Headed
```

### run-e2e-tests.sh (Linux/Mac)
Bash script to run complete E2E test suite with Docker.

**Usage**:
```bash
# Make executable (first time only)
chmod +x run-e2e-tests.sh

# Run tests (with cleanup)
./run-e2e-tests.sh

# Run tests without cleanup (keeps containers running)
./run-e2e-tests.sh --no-cleanup

# Run tests with browser visible
./run-e2e-tests.sh --headed

# Combined options
./run-e2e-tests.sh --no-cleanup --headed
```

## What These Scripts Do

1. **Build** Docker images for database, API, and UI
2. **Start** all containers using docker-compose
3. **Wait** for services to be healthy (health checks)
4. **Install** Playwright browsers (if not already installed)
5. **Run** Playwright E2E tests against the running services
6. **Generate** test reports (HTML, JSON, JUnit)
7. **Cleanup** containers and volumes (unless --no-cleanup flag used)

## Supporting Files

### init-db.sql
SQL script that initializes the Trading Station database in the SQL Server container.

### wait-for-db.sh
Helper script that waits for SQL Server to be ready before proceeding.

## Requirements

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Node.js 18+ (for Playwright)
- PowerShell 5.1+ (Windows) or Bash (Linux/Mac)

## Troubleshooting

### Containers Not Starting
```bash
# Check Docker is running
docker --version

# View logs
docker-compose logs

# Restart Docker Desktop
```

### Port Conflicts
If ports 1433, 5000, or 3000 are in use:
```bash
# Find what's using the port (Windows)
netstat -ano | findstr :5000

# Find what's using the port (Linux/Mac)
lsof -i :5000

# Change ports in docker-compose.yml
```

### Tests Failing
```bash
# Keep containers running for debugging
./run-e2e-tests.sh --no-cleanup

# Check service health
docker inspect --format='{{.State.Health.Status}}' tradingstation-api

# View container logs
docker logs tradingstation-api -f

# Access running API
curl http://localhost:5000/health

# Access running UI
curl http://localhost:3000
```

## Manual Operations

### Start Services Without Tests
```bash
cd .. # Go to project root
docker-compose up -d
```

### Stop Services
```bash
docker-compose down      # Stop containers
docker-compose down -v   # Stop and remove volumes
```

### View Logs
```bash
docker-compose logs -f           # All services
docker logs tradingstation-api   # Just API
docker logs tradingstation-db    # Just database
```

## More Information

See [E2E_TESTS_COMPLETE.md](../E2E_TESTS_COMPLETE.md) for comprehensive documentation.
