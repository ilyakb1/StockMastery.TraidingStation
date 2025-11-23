# Trading Station - Updated Technology Stack with Trading Engine

## Project Structure Updates

```
TradingStation.sln
├── Core/
│   ├── TradingStation.Contracts/              ← NEW: Shared interfaces
│   ├── TradingStation.Domain/                 ← Existing: Domain models
│   └── TradingStation.TradingEngine/          ← NEW: Reusable trading logic
├── Application/
│   ├── TradingStation.Application/            ← Existing: Services
│   ├── TradingStation.Backtesting/            ← NEW: Backtest orchestration
│   └── TradingStation.LiveTrading/            ← NEW: Live trading (future)
├── Infrastructure/
│   ├── TradingStation.Infrastructure/         ← Existing: EF Core, repos
│   ├── TradingStation.Data.Backtesting/       ← NEW: Temporal data provider
│   └── TradingStation.Data.Live/              ← NEW: Live data provider
├── Presentation/
│   └── TradingStation.API/                    ← Existing: Web API
├── Tests/
│   ├── TradingStation.UnitTests/
│   ├── TradingStation.TradingEngine.Tests/    ← NEW: Engine tests
│   ├── TradingStation.Backtesting.Tests/      ← NEW: Backtest tests
│   └── TradingStation.IntegrationTests/
└── Web/
    └── trading-station-web/                   ← Existing: React app
```

## New Project NuGet Packages

### 1. TradingStation.Contracts
**Purpose:** Shared interfaces and contracts

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <!-- No external dependencies - pure interfaces -->
  </ItemGroup>
</Project>
```

**Key Files:**
- `IMarketDataProvider.cs`
- `IIndicatorProvider.cs`
- `IOrderExecutionService.cs`
- `IPositionManager.cs`
- `IRiskManager.cs`
- `IAccountManager.cs`

---

### 2. TradingStation.TradingEngine
**Purpose:** Core trading logic (environment-agnostic)

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\TradingStation.Contracts\TradingStation.Contracts.csproj" />
    <ProjectReference Include="..\TradingStation.Domain\TradingStation.Domain.csproj" />
  </ItemGroup>

  <ItemGroup>
    <!-- Minimal dependencies - pure logic -->
    <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="8.0.0" />
  </ItemGroup>
</Project>
```

**Components:**
- `OrderExecutionEngine.cs`
- `PositionManager.cs`
- `RiskManager.cs`
- `AccountManager.cs`
- `CommissionCalculator.cs`
- `StopLossEvaluator.cs`

---

### 3. TradingStation.Data.Backtesting
**Purpose:** Temporal-safe data provider for backtesting

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\TradingStation.Contracts\TradingStation.Contracts.csproj" />
    <ProjectReference Include="..\TradingStation.Domain\TradingStation.Domain.csproj" />
    <ProjectReference Include="..\TradingStation.Infrastructure\TradingStation.Infrastructure.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Caching.Memory" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="8.0.0" />
  </ItemGroup>
</Project>
```

**Key Classes:**
- `BacktestingMarketDataProvider.cs` - Time-constrained data access
- `BacktestingIndicatorProvider.cs` - Historical indicator calculations
- `FutureDataAccessException.cs` - Custom exception for temporal violations
- `SimulationClock.cs` - Internal time management

---

### 4. TradingStation.Backtesting
**Purpose:** Backtest orchestration and strategy execution

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\TradingStation.Contracts\TradingStation.Contracts.csproj" />
    <ProjectReference Include="..\TradingStation.Domain\TradingStation.Domain.csproj" />
    <ProjectReference Include="..\TradingStation.TradingEngine\TradingStation.TradingEngine.csproj" />
    <ProjectReference Include="..\TradingStation.Data.Backtesting\TradingStation.Data.Backtesting.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
    <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="8.0.0" />
    <PackageReference Include="CsvHelper" Version="30.0.1" />
  </ItemGroup>
</Project>
```

**Key Classes:**
- `BacktestRunner.cs` - Main backtest loop
- `IStrategy.cs` - Strategy interface
- `BacktestResult.cs` - Results container
- `PerformanceMetricsCalculator.cs` - Win rate, Sharpe ratio, etc.
- `EquityCurveGenerator.cs` - Track account value over time
- `TradeAnalyzer.cs` - Analyze individual trades

**Built-in Strategies:**
- `MovingAverageCrossoverStrategy.cs`
- `RSIStrategy.cs`
- `MACDStrategy.cs`

---

### 5. TradingStation.Data.Live (Future)
**Purpose:** Live market data provider

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\TradingStation.Contracts\TradingStation.Contracts.csproj" />
    <ProjectReference Include="..\TradingStation.Domain\TradingStation.Domain.csproj" />
    <ProjectReference Include="..\TradingStation.Infrastructure\TradingStation.Infrastructure.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Http" Version="8.0.0" />
    <PackageReference Include="Polly" Version="8.2.1" /> <!-- Retry policies -->
    <PackageReference Include="Polly.Extensions.Http" Version="3.0.0" />
  </ItemGroup>
</Project>
```

**Key Classes:**
- `LiveMarketDataProvider.cs`
- `ExternalApiClient.cs`
- `WebSocketDataStream.cs`

---

### 6. TradingStation.LiveTrading (Future)
**Purpose:** Live trading orchestration

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\TradingStation.Contracts\TradingStation.Contracts.csproj" />
    <ProjectReference Include="..\TradingStation.TradingEngine\TradingStation.TradingEngine.csproj" />
    <ProjectReference Include="..\TradingStation.Data.Live\TradingStation.Data.Live.csproj" />
  </ItemGroup>

  <ItemGroup>
    <PackageReference Include="Quartz" Version="3.8.0" /> <!-- Scheduled tasks -->
  </ItemGroup>
</Project>
```

---

## Updated Existing Projects

### TradingStation.Domain (Updated)
**No new packages, but new domain models:**

```csharp
// New domain models
public class BacktestConfiguration
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal InitialCapital { get; set; }
    public List<string> Symbols { get; set; }
    public string StrategyName { get; set; }
    public Dictionary<string, object> StrategyParameters { get; set; }
}

public class BacktestResult
{
    public Guid Id { get; set; }
    public BacktestConfiguration Configuration { get; set; }
    public List<Trade> Trades { get; set; }
    public PerformanceMetrics Metrics { get; set; }
    public List<EquityPoint> EquityCurve { get; set; }
    public DateTime CompletedAt { get; set; }
}

public class PerformanceMetrics
{
    public decimal TotalReturn { get; set; }
    public decimal TotalReturnPercent { get; set; }
    public int TotalTrades { get; set; }
    public int WinningTrades { get; set; }
    public int LosingTrades { get; set; }
    public decimal WinRate { get; set; }
    public decimal AverageWin { get; set; }
    public decimal AverageLoss { get; set; }
    public decimal MaxDrawdown { get; set; }
    public decimal SharpeRatio { get; set; }
    public decimal ProfitFactor { get; set; }
}
```

---

### TradingStation.Application (Updated)
**New service:**

```csharp
// New service
public interface IBacktestService
{
    Task<BacktestResult> RunBacktestAsync(BacktestConfiguration config);
    Task<BacktestResult> GetBacktestResultAsync(Guid id);
    Task<List<BacktestResult>> GetAllBacktestResultsAsync();
    Task<List<string>> GetAvailableStrategiesAsync();
}
```

**New package:**
```xml
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" /> <!-- Strategy parameter serialization -->
```

---

### TradingStation.API (Updated)
**New controller:**

```csharp
[ApiController]
[Route("api/[controller]")]
public class BacktestController : ControllerBase
{
    private readonly IBacktestService _backtestService;

    [HttpPost]
    public async Task<ActionResult<BacktestResult>> RunBacktest(
        [FromBody] BacktestConfiguration config)
    {
        var result = await _backtestService.RunBacktestAsync(config);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BacktestResult>> GetResult(Guid id)
    {
        var result = await _backtestService.GetBacktestResultAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("strategies")]
    public async Task<ActionResult<List<string>>> GetStrategies()
    {
        var strategies = await _backtestService.GetAvailableStrategiesAsync();
        return Ok(strategies);
    }
}
```

---

## Test Projects

### TradingStation.TradingEngine.Tests
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="xunit" Version="2.6.5" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.6" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="Moq" Version="4.20.70" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\Core\TradingStation.TradingEngine\TradingStation.TradingEngine.csproj" />
  </ItemGroup>
</Project>
```

**Test Structure:**
- `OrderExecutionEngineTests.cs`
- `PositionManagerTests.cs`
- `RiskManagerTests.cs`
- `AccountManagerTests.cs`

---

### TradingStation.Backtesting.Tests
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="xunit" Version="2.6.5" />
    <PackageReference Include="Moq" Version="4.20.70" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\Application\TradingStation.Backtesting\TradingStation.Backtesting.csproj" />
    <ProjectReference Include="..\..\Infrastructure\TradingStation.Data.Backtesting\TradingStation.Data.Backtesting.csproj" />
  </ItemGroup>
</Project>
```

**Test Structure:**
- `BacktestingMarketDataProviderTests.cs` - **CRITICAL: Test temporal safety**
- `BacktestRunnerTests.cs`
- `StrategyTests.cs`
- `PerformanceMetricsCalculatorTests.cs`

**Example Temporal Safety Test:**
```csharp
[Fact]
public async Task BacktestingDataProvider_ShouldThrow_WhenAccessingFutureData()
{
    // Arrange
    var simulationTime = new DateTime(2024, 1, 15);
    var provider = new BacktestingMarketDataProvider(
        _mockRepository.Object,
        simulationTime);

    var futureTime = simulationTime.AddDays(1);

    // Act & Assert
    await Assert.ThrowsAsync<FutureDataAccessException>(
        () => provider.GetPriceAsync("AAPL", futureTime));
}

[Fact]
public async Task BacktestRunner_ShouldNotAccessFutureData_DuringBacktest()
{
    // Arrange
    var config = new BacktestConfiguration
    {
        StartDate = new DateTime(2020, 1, 1),
        EndDate = new DateTime(2020, 12, 31),
        InitialCapital = 100000m,
        Symbols = new[] { "AAPL" }
    };

    // Act
    var result = await _backtestRunner.RunAsync(config);

    // Assert - verify all data access was temporally safe
    _mockDataProvider.Verify(
        x => x.GetPriceAsync(
            It.IsAny<string>(),
            It.Is<DateTime>(dt => dt <= config.EndDate)),
        Times.AtLeastOnce());
}
```

---

## Dependency Injection Configuration

### Program.cs (Updated)

```csharp
var builder = WebApplication.CreateBuilder(args);

// Core services
builder.Services.AddScoped<IStockRepository, StockRepository>();
builder.Services.AddScoped<IPositionRepository, PositionRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<ITraderAccountRepository, TraderAccountRepository>();

// Trading Engine (Reusable)
builder.Services.AddScoped<IOrderExecutionService, OrderExecutionEngine>();
builder.Services.AddScoped<IPositionManager, PositionManager>();
builder.Services.AddScoped<IRiskManager, RiskManager>();
builder.Services.AddScoped<IAccountManager, AccountManager>();

// Backtesting Infrastructure
builder.Services.AddScoped<IMarketDataProvider, BacktestingMarketDataProvider>(sp =>
{
    // Factory to create with start time
    var repository = sp.GetRequiredService<IStockRepository>();
    return new BacktestingMarketDataProvider(repository, DateTime.UtcNow);
});

// Application Services
builder.Services.AddScoped<IBacktestService, BacktestService>();
builder.Services.AddScoped<IStockService, StockService>();

// Backtesting
builder.Services.AddScoped<BacktestRunner>();
builder.Services.AddScoped<IStrategy, MovingAverageCrossoverStrategy>();

// Database
builder.Services.AddDbContext<TradingStationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Caching
builder.Services.AddMemoryCache();

// Controllers & SignalR
builder.Services.AddControllers();
builder.Services.AddSignalR();

var app = builder.Build();
```

---

## Frontend Updates

### New NPM Packages

```json
{
  "dependencies": {
    "react-table": "^7.8.0",
    "recharts": "^2.10.3",
    "date-fns": "^3.0.6"
  }
}
```

### New Components

```
src/components/
├── backtest/
│   ├── BacktestConfiguration.tsx     - Setup backtest parameters
│   ├── BacktestRunner.tsx            - Run backtest button & progress
│   ├── BacktestResults.tsx           - Display results
│   ├── EquityCurveChart.tsx          - Equity curve visualization
│   ├── TradeList.tsx                 - List of all trades
│   ├── PerformanceMetrics.tsx        - Win rate, Sharpe, etc.
│   └── StrategySelector.tsx          - Choose strategy
```

---

## Complete Dependency Graph

```
TradingStation.API
├── TradingStation.Application
│   ├── TradingStation.Backtesting
│   │   ├── TradingStation.TradingEngine
│   │   │   ├── TradingStation.Contracts
│   │   │   └── TradingStation.Domain
│   │   └── TradingStation.Data.Backtesting
│   │       ├── TradingStation.Contracts
│   │       ├── TradingStation.Domain
│   │       └── TradingStation.Infrastructure
│   └── TradingStation.Domain
└── TradingStation.Infrastructure
    └── TradingStation.Domain
```

---

## Build Order

```bash
# 1. Core contracts and domain
dotnet build TradingStation.Contracts
dotnet build TradingStation.Domain

# 2. Trading engine (depends on contracts & domain)
dotnet build TradingStation.TradingEngine

# 3. Infrastructure (depends on domain)
dotnet build TradingStation.Infrastructure

# 4. Data providers (depend on contracts, domain, infrastructure)
dotnet build TradingStation.Data.Backtesting
dotnet build TradingStation.Data.Live

# 5. Application layer (depends on backtesting & trading engine)
dotnet build TradingStation.Backtesting
dotnet build TradingStation.Application

# 6. API (depends on application)
dotnet build TradingStation.API

# 7. Tests
dotnet test
```

---

## Key Benefits of This Structure

1. **Separation of Concerns**
   - Trading logic isolated in TradingEngine DLL
   - Data access abstracted behind IMarketDataProvider
   - Backtesting orchestration separate from trading logic

2. **Reusability**
   - Same TradingEngine for backtesting and live trading
   - Contracts shared across all projects
   - Strategies can be tested and deployed identically

3. **Temporal Safety**
   - Data.Backtesting enforces time constraints
   - Multiple layers of protection against future data leakage
   - Unit tests verify temporal correctness

4. **Testability**
   - Each component can be unit tested independently
   - Mocking is straightforward with interfaces
   - Integration tests validate end-to-end flows

5. **Maintainability**
   - Clear project boundaries
   - Minimal dependencies
   - Easy to understand and modify
