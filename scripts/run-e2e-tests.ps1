# End-to-End Test Orchestration Script (PowerShell)
# This script spins up all Docker containers, runs E2E tests, and tears down

param(
    [switch]$NoCleanup,
    [switch]$Headed
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Trading Station E2E Test Suite" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Cleanup function
function Cleanup {
    if (-not $NoCleanup) {
        Write-Host "🧹 Cleaning up Docker containers..." -ForegroundColor Yellow
        docker-compose down -v
        Write-Host "✅ Cleanup complete" -ForegroundColor Green
    }
    else {
        Write-Host "⏸️  Skipping cleanup (--NoCleanup flag set)" -ForegroundColor Yellow
        Write-Host "To stop containers manually, run: docker-compose down -v" -ForegroundColor Blue
    }
}

# Register cleanup
trap { Cleanup; break }

try {
    # Step 1: Build and start Docker containers
    Write-Host "📦 Building Docker images..." -ForegroundColor Blue
    docker-compose build

    Write-Host "🚀 Starting Docker containers..." -ForegroundColor Blue
    docker-compose up -d

    # Step 2: Wait for services to be healthy
    Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Blue

    $maxWait = 120
    $elapsed = 0

    while ($elapsed -lt $maxWait) {
        try {
            $dbHealthy = (docker inspect --format='{{.State.Health.Status}}' tradingstation-db 2>$null) -eq "healthy"
            $apiHealthy = (docker inspect --format='{{.State.Health.Status}}' tradingstation-api 2>$null) -eq "healthy"
            $uiHealthy = (docker inspect --format='{{.State.Health.Status}}' tradingstation-ui 2>$null) -eq "healthy"

            $dbStatus = if ($dbHealthy) { "healthy" } else { "starting" }
            $apiStatus = if ($apiHealthy) { "healthy" } else { "starting" }
            $uiStatus = if ($uiHealthy) { "healthy" } else { "starting" }

            Write-Host "  DB: $dbStatus | API: $apiStatus | UI: $uiStatus"

            if ($dbHealthy -and $apiHealthy -and $uiHealthy) {
                Write-Host "✅ All services are healthy!" -ForegroundColor Green
                break
            }
        }
        catch {
            Write-Host "  Waiting for containers to start..."
        }

        Start-Sleep -Seconds 5
        $elapsed += 5
    }

    if ($elapsed -ge $maxWait) {
        Write-Host "❌ Services did not become healthy within ${maxWait}s" -ForegroundColor Red
        Write-Host "Container logs:" -ForegroundColor Yellow
        docker-compose logs --tail=50
        exit 1
    }

    # Step 3: Install Playwright browsers if needed
    Write-Host "🌐 Ensuring Playwright browsers are installed..." -ForegroundColor Blue
    Push-Location ui
    npx playwright install chromium --with-deps

    # Step 4: Run E2E tests
    Write-Host "🧪 Running E2E tests..." -ForegroundColor Blue

    $env:API_URL = "http://localhost:5000"
    $env:UI_URL = "http://localhost:3000"

    if ($Headed) {
        npm run test:e2e -- --config=playwright.docker.config.ts --headed
    }
    else {
        npm run test:e2e -- --config=playwright.docker.config.ts
    }

    $testExitCode = $LASTEXITCODE
    Pop-Location

    # Step 5: Show test results
    if ($testExitCode -eq 0) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ All E2E tests passed!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    }
    else {
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "❌ E2E tests failed" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red

        Write-Host "📊 Opening test report..." -ForegroundColor Yellow
        Push-Location ui
        npm run test:report
        Pop-Location
    }

    exit $testExitCode
}
finally {
    Cleanup
}
