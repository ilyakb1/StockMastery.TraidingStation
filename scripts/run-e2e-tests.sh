#!/bin/bash
# End-to-End Test Orchestration Script
# This script spins up all Docker containers, runs E2E tests, and tears down

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Trading Station E2E Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"

# Parse arguments
CLEANUP=true
HEADED=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --no-cleanup)
      CLEANUP=false
      shift
      ;;
    --headed)
      HEADED=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Cleanup function
cleanup() {
  if [ "$CLEANUP" = true ]; then
    echo -e "${YELLOW}🧹 Cleaning up Docker containers...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✅ Cleanup complete${NC}"
  else
    echo -e "${YELLOW}⏸️  Skipping cleanup (--no-cleanup flag set)${NC}"
    echo -e "${BLUE}To stop containers manually, run: docker-compose down -v${NC}"
  fi
}

# Trap exit to ensure cleanup
trap cleanup EXIT

# Step 1: Build and start Docker containers
echo -e "${BLUE}📦 Building Docker images...${NC}"
docker-compose build

echo -e "${BLUE}🚀 Starting Docker containers...${NC}"
docker-compose up -d

# Step 2: Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"

MAX_WAIT=120
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  DB_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' tradingstation-db 2>/dev/null || echo "starting")
  API_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' tradingstation-api 2>/dev/null || echo "starting")
  UI_HEALTHY=$(docker inspect --format='{{.State.Health.Status}}' tradingstation-ui 2>/dev/null || echo "starting")

  echo -e "  DB: $DB_HEALTHY | API: $API_HEALTHY | UI: $UI_HEALTHY"

  if [ "$DB_HEALTHY" = "healthy" ] && [ "$API_HEALTHY" = "healthy" ] && [ "$UI_HEALTHY" = "healthy" ]; then
    echo -e "${GREEN}✅ All services are healthy!${NC}"
    break
  fi

  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo -e "${RED}❌ Services did not become healthy within ${MAX_WAIT}s${NC}"
  echo -e "${YELLOW}Container logs:${NC}"
  docker-compose logs --tail=50
  exit 1
fi

# Step 3: Install Playwright browsers if needed
echo -e "${BLUE}🌐 Ensuring Playwright browsers are installed...${NC}"
cd ui
npx playwright install chromium --with-deps

# Step 4: Run E2E tests
echo -e "${BLUE}🧪 Running E2E tests...${NC}"

export API_URL=http://localhost:5000
export UI_URL=http://localhost:3000

if [ "$HEADED" = true ]; then
  npm run test:e2e -- --config=playwright.docker.config.ts --headed
else
  npm run test:e2e -- --config=playwright.docker.config.ts
fi

TEST_EXIT_CODE=$?

# Step 5: Show test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ All E2E tests passed!${NC}"
  echo -e "${GREEN}========================================${NC}"
else
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}❌ E2E tests failed${NC}"
  echo -e "${RED}========================================${NC}"

  echo -e "${YELLOW}📊 Opening test report...${NC}"
  npm run test:report
fi

exit $TEST_EXIT_CODE
