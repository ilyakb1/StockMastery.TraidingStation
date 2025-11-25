# Docker Quick Start Guide

Get the Trading Station up and running with Docker in 5 minutes.

## Prerequisites

1. **Install Docker Desktop**
   - Windows/Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: Install Docker Engine and Docker Compose

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

## Quick Start

### Option 1: Run Development Environment

```bash
# Navigate to project root
cd c:\repos\StockMastery\TraidingStation

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access services:
# - UI: http://localhost:3000
# - API: http://localhost:5000
# - Database: localhost:1433
```

### Option 2: Run E2E Tests

**Windows**:
```powershell
cd c:\repos\StockMastery\TraidingStation
.\scripts\run-e2e-tests.ps1
```

**Linux/Mac**:
```bash
cd /repos/StockMastery/TraidingStation
chmod +x scripts/run-e2e-tests.sh
./scripts/run-e2e-tests.sh
```

## Services

| Service | URL | Container Name |
|---------|-----|----------------|
| React UI | http://localhost:3000 | tradingstation-ui |
| .NET API | http://localhost:5000 | tradingstation-api |
| SQL Server | localhost:1433 | tradingstation-db |

### Default Credentials

**Database**:
- Username: `sa`
- Password: `TradingStation2024!`
- Database: `TradingStation`

## Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Restart a specific service
docker-compose restart api
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker logs tradingstation-api -f
docker logs tradingstation-ui -f
docker logs tradingstation-db -f
```

### Check Health

```bash
# Check all containers
docker-compose ps

# Check health status
docker inspect --format='{{.State.Health.Status}}' tradingstation-api

# Check API health endpoint
curl http://localhost:5000/health

# Check UI
curl http://localhost:3000
```

### Access Containers

```bash
# Execute command in API container
docker exec -it tradingstation-api bash

# Connect to database
docker exec -it tradingstation-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P TradingStation2024!

# View API files
docker exec tradingstation-api ls -la
```

## Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build api

# Rebuild all services
docker-compose build

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Containers Won't Start

```bash
# Check Docker is running
docker info

# View error logs
docker-compose logs

# Remove old containers
docker-compose down -v
docker-compose up -d --build
```

### Port Already in Use

```bash
# Check what's using the port (Windows)
netstat -ano | findstr :5000

# Check what's using the port (Linux/Mac)
lsof -i :5000

# Solution: Edit docker-compose.yml to use different ports
ports:
  - "5001:8080"  # Use 5001 instead of 5000
```

### Database Connection Failed

```bash
# Check database is running
docker exec tradingstation-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P TradingStation2024! -Q "SELECT 1"

# View database logs
docker logs tradingstation-db

# Restart database
docker-compose restart db
```

### API Not Responding

```bash
# Check API logs
docker logs tradingstation-api -f

# Check if migrations ran
docker exec tradingstation-api dotnet ef migrations list

# Restart API
docker-compose restart api
```

## Architecture

```
┌──────────────────────────────────────┐
│  React UI (Nginx)                    │
│  http://localhost:3000               │
└────────────┬─────────────────────────┘
             │
             ↓ HTTP
┌──────────────────────────────────────┐
│  .NET 8 API                          │
│  http://localhost:5000               │
└────────────┬─────────────────────────┘
             │
             ↓ SQL
┌──────────────────────────────────────┐
│  SQL Server 2022                     │
│  localhost:1433                      │
└──────────────────────────────────────┘
```

## Development Workflow

1. **Start Services**
   ```bash
   docker-compose up -d
   ```

2. **Make Code Changes**
   - Edit files locally
   - Changes to UI require rebuild
   - Changes to API require rebuild

3. **Rebuild & Deploy**
   ```bash
   docker-compose up -d --build
   ```

4. **View Logs**
   ```bash
   docker-compose logs -f api
   ```

5. **Stop Services**
   ```bash
   docker-compose down
   ```

## Production Considerations

⚠️ **This configuration is for development/testing only!**

For production, you should:
1. Change default passwords
2. Use environment variables for secrets
3. Enable HTTPS
4. Use production database settings
5. Configure proper logging
6. Set up health checks and monitoring
7. Use orchestration (Kubernetes, Docker Swarm)

## More Information

- **Complete Guide**: [E2E_TESTS_COMPLETE.md](E2E_TESTS_COMPLETE.md)
- **Project Documentation**: [CLAUDE.md](CLAUDE.md)
- **Implementation Status**: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- **Docker Compose Reference**: [docker-compose.yml](docker-compose.yml)

## Getting Help

### View Service Status
```bash
docker-compose ps
```

### View All Logs
```bash
docker-compose logs --tail=100
```

### Clean Slate Restart
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

### Verify Everything Works
```bash
# Check database
docker exec tradingstation-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P TradingStation2024! -Q "SELECT @@VERSION"

# Check API
curl http://localhost:5000/health

# Check UI
curl http://localhost:3000
```

---

**Ready to test?** Run the E2E test suite:
```bash
# Windows
.\scripts\run-e2e-tests.ps1

# Linux/Mac
./scripts/run-e2e-tests.sh
```
