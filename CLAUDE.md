# CLAUDE.md - Trading Station AI Assistant Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Key Components](#key-components)
5. [Development Workflows](#development-workflows)
6. [Temporal Safety (Critical)](#temporal-safety-critical)
7. [Testing Strategy](#testing-strategy)
8. [Coding Conventions](#coding-conventions)
9. [Common Tasks](#common-tasks)
10. [File Locations Reference](#file-locations-reference)

---

## Project Overview

**Trading Station** is a historical trading simulation platform built with .NET 8 and React that enables testing trading strategies on historical stock market data. The platform enforces temporal safety to prevent look-ahead bias during backtesting.

### Tech Stack
- **Backend**: .NET 8, ASP.NET Core Web API, Entity Framework Core 8, SignalR
- **Frontend**: React 18+, Redux Toolkit, TypeScript, react-financial-charts (planned)
- **Database**: SQL Server 2019+
- **Testing**: xUnit, FluentAssertions, Moq
- **NuGet Packages**:
  - Skender.Stock.Indicators (technical indicators)
  - CsvHelper (data parsing)
  - Serilog (logging)
  - AutoMapper (DTO mapping)
  - FluentValidation (input validation)
  - MathNet.Numerics (backtesting calculations)

### Project Purpose
Enable traders and analysts to:
- Test trading strategies against historical market data
- Simulate realistic trading with buy/sell orders, stop-loss mechanisms
- Visualize stock performance with technical indicators (MACD, SMA, RSI, Volume MA)
- Analyze strategy effectiveness with performance metrics (Sharpe ratio, max drawdown, win rate)
- Manage virtual trading accounts with risk management

### Critical Architectural Principle: Temporal Safety
**MUST READ**: The entire system is designed to prevent "look-ahead bias" in backtesting. The `BacktestingMarketDataProvider` enforces that no component can access future data during simulation. All market data access MUST go through `IMarketDataProvider` interface.

---

## Codebase Structure

```
TradingStation.sln
├── src/
│   ├── Core/                                    # Business logic (no dependencies)
│   │   ├── TradingStation.Contracts/           # Interfaces & DTOs
│   │   ├── TradingStation.Domain/              # Entities & domain models
│   │   └── TradingStation.TradingEngine/       # Reusable trading engine DLL
│   ├── Application/                             # Use cases & orchestration
│   │   ├── TradingStation.Application/         # Application services
│   │   └── TradingStation.Backtesting/         # Backtesting engine
│   ├── Infrastructure/                          # External concerns
│   │   ├── TradingStation.Infrastructure/      # Data access, repositories
│   │   └── TradingStation.Data.Backtesting/    # Temporal-safe data provider
│   └── Presentation/
│       └── TradingStation.API/                 # ASP.NET Core Web API
├── tests/
│   ├── TradingStation.UnitTests/               # General unit tests
│   └── TradingStation.TradingEngine.Tests/     # Trading engine tests
├── Specs/                                       # Detailed specifications
│   ├── Architecture.md                          # Architecture documentation
│   ├── FullSpecification.md                     # Complete technical spec
│   ├── TradingEngineArchitecture.md            # Trading engine design
│   ├── ComponentDiagram.md                      # Component diagrams
│   ├── TechnologyStack.md                       # Technology decisions
│   └── NuGetPackageRecommendations.md          # Package recommendations
├── IMPLEMENTATION_GUIDE.md                      # Step-by-step implementation
├── IMPLEMENTATION_STATUS.md                     # Current progress tracker
└── CLAUDE.md                                    # This file
```

### Solution Organization by Onion Architecture

**Core Layer** (innermost, no dependencies):
- `TradingStation.Contracts` - Interfaces, DTOs, enums
- `TradingStation.Domain` - Entities, value objects, domain interfaces
- `TradingStation.TradingEngine` - Trading logic (OrderExecutionEngine, PositionManager, RiskManager, AccountManager)

**Application Layer** (depends on Core):
- `TradingStation.Application` - Application services, CQRS handlers, validators
- `TradingStation.Backtesting` - Backtesting engine, strategy interface, performance metrics

**Infrastructure Layer** (depends on Core, Application):
- `TradingStation.Infrastructure` - DbContext, repositories, file readers
- `TradingStation.Data.Backtesting` - Temporal-safe market data provider

**Presentation Layer** (outermost):
- `TradingStation.API` - Controllers, SignalR hubs, middleware

---

## Architecture & Design Patterns

### Onion Architecture (Clean Architecture)
The system follows Onion Architecture for:
- Clear separation of concerns
- Dependency inversion (outer layers depend on inner)
- Testability (core logic has no external dependencies)
- Technology independence at the core

### Key Design Patterns

**1. Repository Pattern**
- Abstracts data access logic
- Interfaces: `IStockRepository`, `ITraderAccountRepository`, `IPositionRepository`, `IOrderRepository`
- Implementations in `TradingStation.Infrastructure/Repositories/`

**2. Dependency Injection**
- All dependencies injected via constructor
- Configured in `Program.cs` (API project)
- Enables easy testing with mocks

**3. Strategy Pattern**
- `ITradingStrategy` interface for different trading strategies
- Implementations in `TradingStation.Backtesting/Strategies/`
- Example: `MovingAverageCrossoverStrategy`

**4. CQRS (Command Query Responsibility Segregation)**
- Commands modify state (CreateOrderCommand, ClosePositionCommand)
- Queries return data (GetStockPricesQuery, GetAccountPositionsQuery)

**5. Specification Pattern** (Future)
- Complex query logic encapsulation for filtering stocks, positions

**6. Factory Pattern** (Future)
- `OrderFactory` - Create orders based on type
- `IndicatorFactory` - Create indicator calculators

---

## Key Components

### 1. Trading Engine (Core Business Logic)

**Location**: `src/Core/TradingStation.TradingEngine/`

**Components**:
- **OrderExecutionEngine** (`OrderExecutionEngine.cs`): Orchestrates order execution
  - Validates orders through RiskManager
  - Gets market price from IMarketDataProvider (temporal-safe)
  - Executes buy/sell through PositionManager and AccountManager
  - Calculates commissions

- **PositionManager** (`PositionManager.cs`): Manages trading positions
  - Opens positions (buy orders)
  - Closes positions (sell orders)
  - Tracks unrealized P&L
  - Evaluates stop-loss conditions

- **RiskManager** (`RiskManager.cs`): Validates trading rules
  - Validates order legality
  - Checks account balance sufficiency
  - Evaluates position sizing limits
  - Triggers stop-loss exits

- **AccountManager** (`AccountManager.cs`): Manages account state
  - Reserves funds for orders
  - Updates balances after trades
  - Calculates total equity (cash + positions)
  - Tracks transaction history

**Key Methods**:
```csharp
// OrderExecutionEngine
Task<OrderResult> ExecuteOrderAsync(OrderRequest order, IMarketDataProvider dataProvider, DateTime currentTime)

// PositionManager
Task<Position> OpenPositionAsync(int accountId, string symbol, decimal entryPrice, int quantity, DateTime entryDate, decimal? stopLoss)
Task<Position> ClosePositionAsync(int positionId, decimal exitPrice, DateTime exitDate, string reason)

// RiskManager
Task<ValidationResult> ValidateOrderAsync(OrderRequest order, AccountInfo account)
Task<List<Position>> EvaluateStopLossesAsync(IEnumerable<Position> openPositions, IMarketDataProvider dataProvider, DateTime currentDate)

// AccountManager
Task<AccountInfo> GetAccountAsync(int accountId)
Task<bool> ReserveFundsAsync(int accountId, decimal amount)
Task UpdateBalanceAsync(int accountId, decimal amount)
```

### 2. Temporal Safety System (Critical)

**Location**: `src/Infrastructure/TradingStation.Data.Backtesting/BacktestingMarketDataProvider.cs`

**Purpose**: Prevents look-ahead bias by enforcing that backtesting cannot access future data.

**How It Works**:
1. Maintains internal simulation clock (`_simulationTime`)
2. All data requests validated: `if (asOfTime > _simulationTime) throw FutureDataAccessException`
3. Time advanced explicitly: `AdvanceTime(DateTime newTime)` - cannot move backward
4. Data cached and filtered: `WHERE Date <= _simulationTime`

**Critical Rules for AI Assistants**:
- ✅ **ALWAYS** access market data through `IMarketDataProvider` interface
- ✅ **NEVER** directly query `StockPrices` table in backtesting context
- ✅ **NEVER** bypass temporal constraints
- ✅ **ALWAYS** pass `currentTime` from simulation clock to data provider
- ✅ **TEST** temporal safety with `FutureDataAccessException` scenarios

**Example Usage**:
```csharp
// CORRECT - Temporal safe
var price = await dataProvider.GetPriceAsync(symbol, simulationTime);

// WRONG - Direct database access bypasses temporal safety
var price = await dbContext.StockPrices
    .Where(p => p.Symbol == symbol && p.Date == simulationTime)
    .FirstOrDefaultAsync();
```

### 3. Domain Entities

**Location**: `src/Core/TradingStation.Domain/Entities/`

**Stock** (`Stock.cs`):
- Symbol (PK), Market, Name, Sector, LastUpdated
- Navigation: `List<StockPrice> Prices`

**StockPrice** (`StockPrice.cs`):
- OHLCV data (Open, High, Low, Close, AdjustedClose, Volume)
- One-to-one relationship with Indicator

**Indicator** (`Indicator.cs`):
- Technical indicators: MACD, MacdSignal, MacdHistogram, Sma200, Sma50, VolMA20, Rsi14
- All nullable (not all indicators available for all dates)

**TraderAccount** (`TraderAccount.cs`):
- InitialCapital, CurrentCash, CreatedDate, IsActive
- Navigation: `List<Position>`, `List<Order>`
- Method: `CalculateTotalEquity()` (cash + unrealized position value)

**Position** (`Position.cs`):
- EntryDate, EntryPrice, Quantity, StopLossPrice, StopLossDays
- Status: Open, Closed
- ExitDate, ExitPrice, RealizedPL (nullable, set when closed)
- Methods: `CalculateUnrealizedPL(currentPrice)`, `CalculateDaysHeld(currentDate)`

**Order** (`Order.cs`):
- OrderType: Buy, Sell
- Quantity, Price, OrderDate
- Status: Pending, Executed, Cancelled

### 4. Contracts (Interfaces)

**Location**: `src/Core/TradingStation.Contracts/`

**IMarketDataProvider** (`IMarketDataProvider.cs`):
```csharp
Task<MarketPrice> GetPriceAsync(string symbol, DateTime asOfTime);
Task<IEnumerable<StockPriceData>> GetHistoricalPricesAsync(string symbol, DateTime startTime, DateTime endTime);
Task<bool> IsSymbolAvailableAsync(string symbol, DateTime asOfTime);
DateTime GetCurrentTime(); // For backtesting simulation clock
```

**IOrderExecutionService** (`IOrderExecutionService.cs`):
```csharp
Task<OrderResult> ExecuteOrderAsync(OrderRequest order, IMarketDataProvider dataProvider, DateTime currentTime);
```

**IPositionManager** (`IPositionManager.cs`):
```csharp
Task<Position> OpenPositionAsync(int accountId, string symbol, decimal entryPrice, int quantity, DateTime entryDate, decimal? stopLoss);
Task<Position> ClosePositionAsync(int positionId, decimal exitPrice, DateTime exitDate, string reason);
Task<List<Position>> GetOpenPositionsAsync(int accountId);
```

**IRiskManager** (`IRiskManager.cs`):
```csharp
Task<ValidationResult> ValidateOrderAsync(OrderRequest order, AccountInfo account);
Task<List<Position>> EvaluateStopLossesAsync(IEnumerable<Position> openPositions, IMarketDataProvider dataProvider, DateTime currentDate);
```

**IAccountManager** (`IAccountManager.cs`):
```csharp
Task<AccountInfo> GetAccountAsync(int accountId);
Task<bool> ReserveFundsAsync(int accountId, decimal amount);
Task UpdateBalanceAsync(int accountId, decimal amount);
```

### 5. Database Schema

**Location**: `src/Infrastructure/TradingStation.Infrastructure/Data/TradingStationDbContext.cs`

**Key Configurations**:
- **Stocks**: Symbol (PK, varchar(10)), Market (indexed), Name, Sector
- **StockPrices**: Composite unique index on (Symbol, Date), Decimals with precision (18,4)
- **Indicators**: One-to-one with StockPrices, cascade delete
- **Positions**: Composite index on (AccountId, Status)
- **Orders**: Composite index on (AccountId, Status)

**Connection String**: Configured in `appsettings.json` (API project)

---

## Development Workflows

### Adding a New Feature

1. **Read Specifications**: Check `Specs/` folder for requirements
2. **Update Domain Models** (if needed): Add entities or value objects in `TradingStation.Domain`
3. **Define Interfaces**: Add to `TradingStation.Contracts` if new abstractions needed
4. **Implement Business Logic**: Add to `TradingStation.TradingEngine` or `TradingStation.Application`
5. **Implement Infrastructure**: Add repositories, data access in `TradingStation.Infrastructure`
6. **Create API Endpoints**: Add controllers in `TradingStation.API`
7. **Write Tests**: Add unit tests in `tests/` projects
8. **Update Documentation**: Update `IMPLEMENTATION_STATUS.md` and this file

### Adding a New Trading Strategy

1. **Create Strategy Class**: In `src/Application/TradingStation.Backtesting/Strategies/`
2. **Implement ITradingStrategy**:
   ```csharp
   public interface ITradingStrategy
   {
       string Name { get; }
       Task<SignalResult> GenerateSignalAsync(
           string symbol,
           IMarketDataProvider dataProvider,
           DateTime currentDate);
   }
   ```
3. **Ensure Temporal Safety**: Only use `dataProvider.GetPriceAsync(symbol, currentDate)` - never access future data
4. **Write Tests**: Verify strategy logic and temporal constraints
5. **Register in DI**: Add to `Program.cs` dependency injection

### Adding a New Indicator

1. **Check Skender.Stock.Indicators**: See if indicator already exists
2. **Add to Indicator Entity**: Update `src/Core/TradingStation.Domain/Entities/Indicator.cs`
3. **Update DbContext**: Add property mapping in `TradingStationDbContext`
4. **Create Migration**: `dotnet ef migrations add Add{IndicatorName}`
5. **Update StockFileReader**: Parse from CSV (if available) or calculate using Skender
6. **Update DTOs**: Add to data transfer objects in Application layer

### Running Backtests

1. **Create Account**: Via API or directly in database
2. **Select Stock Set**: Choose symbols from available markets (AU, US, etc.)
3. **Define Strategy**: Select or create strategy implementation
4. **Configure Timeframe**: Set start/end dates for backtest
5. **Execute Backtest**: Call `BacktestRunner.RunAsync()`
6. **Analyze Results**: Review performance metrics (win rate, Sharpe ratio, max drawdown)

---

## Temporal Safety (Critical)

### Why Temporal Safety Matters
In backtesting, "look-ahead bias" occurs when a strategy inadvertently uses future information not available at the decision time. This makes backtests unrealistic and strategies fail in live trading.

### How We Enforce It

**1. Simulation Clock**:
- `BacktestingMarketDataProvider` maintains `_simulationTime`
- Time advances explicitly: `dataProvider.AdvanceTime(nextDate)`
- Cannot move backward: `if (newTime < _simulationTime) throw InvalidOperationException`

**2. Data Access Validation**:
```csharp
public async Task<MarketPrice> GetPriceAsync(string symbol, DateTime asOfTime)
{
    // CRITICAL: Enforce temporal constraint
    if (asOfTime > _simulationTime)
    {
        throw new FutureDataAccessException(
            $"Cannot access data from {asOfTime:yyyy-MM-dd} when simulation time is {_simulationTime:yyyy-MM-dd}");
    }
    // ... return data
}
```

**3. Historical Data Filtering**:
```csharp
var prices = await GetCachedPricesAsync(symbol);
return prices
    .Where(p => p.Date <= _simulationTime)  // Only past data
    .OrderBy(p => p.Date);
```

**4. Interface Enforcement**:
- ALL components use `IMarketDataProvider` interface
- Production: `LiveMarketDataProvider` (real-time data)
- Backtesting: `BacktestingMarketDataProvider` (temporal-safe)
- Same trading engine works in both contexts

### Testing Temporal Safety

**Required Tests**:
```csharp
[Fact]
public async Task GetPriceAsync_FutureDate_ThrowsFutureDataAccessException()
{
    var provider = new BacktestingMarketDataProvider(repo, new DateTime(2024, 1, 1), cache);

    var ex = await Assert.ThrowsAsync<FutureDataAccessException>(
        () => provider.GetPriceAsync("AAPL", new DateTime(2024, 6, 1)));

    Assert.Contains("Cannot access data from", ex.Message);
}

[Fact]
public async Task GetHistoricalPricesAsync_EndDateInFuture_ReturnsOnlyPastData()
{
    var provider = new BacktestingMarketDataProvider(repo, new DateTime(2024, 3, 1), cache);

    var prices = await provider.GetHistoricalPricesAsync(
        "AAPL",
        new DateTime(2024, 1, 1),
        new DateTime(2024, 12, 31)); // Future date

    Assert.All(prices, p => Assert.True(p.Date <= new DateTime(2024, 3, 1)));
}
```

### Common Temporal Safety Violations to Avoid

**❌ WRONG - Direct database query**:
```csharp
// This bypasses temporal safety!
var prices = await _dbContext.StockPrices
    .Where(p => p.Symbol == symbol)
    .ToListAsync();
```

**✅ CORRECT - Through IMarketDataProvider**:
```csharp
var prices = await _dataProvider.GetHistoricalPricesAsync(
    symbol,
    startDate,
    currentSimulationTime);
```

**❌ WRONG - Using DateTime.Now in backtesting**:
```csharp
var currentPrice = await _dataProvider.GetPriceAsync(symbol, DateTime.Now);
```

**✅ CORRECT - Using simulation time**:
```csharp
var simulationTime = _dataProvider.GetCurrentTime();
var currentPrice = await _dataProvider.GetPriceAsync(symbol, simulationTime);
```

---

## Testing Strategy

### Unit Testing

**Framework**: xUnit
**Mocking**: Moq
**Assertions**: FluentAssertions

**Test Organization**:
- `TradingStation.UnitTests/` - General unit tests
- `TradingStation.TradingEngine.Tests/` - Trading engine specific tests

**Critical Test Areas**:
1. **Temporal Safety** (HIGHEST PRIORITY)
   - Test `FutureDataAccessException` scenarios
   - Verify time advancement logic
   - Test data filtering by simulation time

2. **Trading Engine**
   - Order execution logic
   - Position management (open/close)
   - Risk validation rules
   - P&L calculations

3. **Risk Management**
   - Stop-loss trigger conditions
   - Position sizing limits
   - Account balance validation

4. **Data Access**
   - Repository CRUD operations
   - CSV file parsing
   - Indicator calculations

**Test Coverage Goal**: > 80% for critical components (TradingEngine, Data.Backtesting, RiskManager)

### Integration Testing

**Scope**:
- API endpoint tests
- Database integration tests
- SignalR hub tests
- Full backtest execution tests

### Example Test Structure

```csharp
public class OrderExecutionEngineTests
{
    private readonly Mock<IPositionManager> _positionManagerMock;
    private readonly Mock<IAccountManager> _accountManagerMock;
    private readonly Mock<IRiskManager> _riskManagerMock;
    private readonly Mock<IMarketDataProvider> _dataProviderMock;
    private readonly Mock<ILogger<OrderExecutionEngine>> _loggerMock;
    private readonly OrderExecutionEngine _sut;

    public OrderExecutionEngineTests()
    {
        _positionManagerMock = new Mock<IPositionManager>();
        _accountManagerMock = new Mock<IAccountManager>();
        _riskManagerMock = new Mock<IRiskManager>();
        _dataProviderMock = new Mock<IMarketDataProvider>();
        _loggerMock = new Mock<ILogger<OrderExecutionEngine>>();

        _sut = new OrderExecutionEngine(
            _positionManagerMock.Object,
            _accountManagerMock.Object,
            _riskManagerMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task ExecuteOrderAsync_ValidBuyOrder_OpensPosition()
    {
        // Arrange
        var order = new OrderRequest { /* ... */ };
        // ... setup mocks

        // Act
        var result = await _sut.ExecuteOrderAsync(order, _dataProviderMock.Object, DateTime.Now);

        // Assert
        result.IsSuccess.Should().BeTrue();
        _positionManagerMock.Verify(x => x.OpenPositionAsync(/* ... */), Times.Once);
    }
}
```

---

## Coding Conventions

### General C# Standards

**Style**: Follow Microsoft C# Coding Conventions
- PascalCase for public members, classes, namespaces
- camelCase for private fields (prefix with `_`)
- Use `var` when type is obvious
- Prefer expression-bodied members for simple methods
- Use nullable reference types (enabled in .NET 8)

### File Organization

**One class per file** (except nested classes)
**File naming**: Match class name exactly (e.g., `OrderExecutionEngine.cs`)
**Namespace structure**: Match folder structure

### Async/Await

- **Always** use async/await for I/O operations (database, file system)
- Suffix async methods with `Async`
- Return `Task<T>` or `Task`
- Never use `.Result` or `.Wait()` - causes deadlocks

### Error Handling

**Use specific exceptions**:
```csharp
throw new FutureDataAccessException($"Cannot access data from {date}");
throw new InsufficientFundsException($"Account {id} has insufficient funds");
```

**Log exceptions**:
```csharp
catch (Exception ex)
{
    _logger.LogError(ex, "Error executing order for {Symbol}", order.Symbol);
    throw; // Re-throw after logging
}
```

**User-friendly error messages**:
```csharp
return new OrderResult
{
    IsSuccess = false,
    ErrorMessage = "Insufficient funds. Required: $10,000, Available: $5,000"
};
```

### Dependency Injection

**Constructor injection** (preferred):
```csharp
public class OrderExecutionEngine
{
    private readonly IPositionManager _positionManager;
    private readonly ILogger<OrderExecutionEngine> _logger;

    public OrderExecutionEngine(
        IPositionManager positionManager,
        ILogger<OrderExecutionEngine> logger)
    {
        _positionManager = positionManager ?? throw new ArgumentNullException(nameof(positionManager));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
}
```

### Entity Framework Conventions

**DbSet Properties**:
```csharp
public DbSet<Stock> Stocks => Set<Stock>();
public DbSet<StockPrice> StockPrices => Set<StockPrice>();
```

**Async queries**:
```csharp
var stock = await _dbContext.Stocks
    .Include(s => s.Prices)
    .FirstOrDefaultAsync(s => s.Symbol == symbol);
```

**Tracking**: Use `.AsNoTracking()` for read-only queries

### Comments

**XML documentation** for public APIs:
```csharp
/// <summary>
/// Executes a trading order with temporal safety constraints.
/// </summary>
/// <param name="order">The order request details</param>
/// <param name="dataProvider">Temporal-safe market data provider</param>
/// <param name="currentTime">Current simulation time</param>
/// <returns>Order execution result</returns>
public async Task<OrderResult> ExecuteOrderAsync(...)
```

**Inline comments** for complex logic:
```csharp
// CRITICAL: Enforce temporal constraint to prevent look-ahead bias
if (asOfTime > _simulationTime)
{
    throw new FutureDataAccessException(...);
}
```

### Logging Levels

- **Debug**: Detailed flow information (loop iterations, variable values)
- **Information**: High-level flow (order executed, position opened)
- **Warning**: Recoverable errors (validation failures, retries)
- **Error**: Unexpected exceptions, failures
- **Critical**: System-wide failures (database down, critical data corruption)

---

## Common Tasks

### Building the Solution

```bash
# Restore packages
dotnet restore

# Build all projects
dotnet build

# Build in Release mode
dotnet build -c Release
```

### Running Tests

```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test tests/TradingStation.TradingEngine.Tests/

# Run with coverage (requires coverlet)
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover
```

### Database Migrations

```bash
# Add new migration (from API project directory)
cd src/Presentation/TradingStation.API
dotnet ef migrations add MigrationName --project ../../Infrastructure/TradingStation.Infrastructure/

# Update database
dotnet ef database update --project ../../Infrastructure/TradingStation.Infrastructure/

# Remove last migration (if not applied)
dotnet ef migrations remove --project ../../Infrastructure/TradingStation.Infrastructure/

# Generate SQL script
dotnet ef migrations script --project ../../Infrastructure/TradingStation.Infrastructure/ -o migration.sql
```

### Adding NuGet Packages

```bash
# Example: Add package to TradingEngine project
cd src/Core/TradingStation.TradingEngine
dotnet add package PackageName --version X.X.X
```

### Running the API

```bash
cd src/Presentation/TradingStation.API
dotnet run

# With hot reload
dotnet watch run
```

**API URLs**:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001
- Swagger: https://localhost:5001/swagger

### Git Workflow

**Branch Naming**:
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical production fixes
- `claude/claude-md-{session-id}` - AI assistant branches (auto-generated)

**Commit Message Format**:
```
<type>: <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Example**:
```
feat: Add moving average crossover strategy

Implement ITradingStrategy for MA crossover with configurable
short and long period windows. Ensures temporal safety by using
IMarketDataProvider interface for all data access.

Closes #123
```

### Data File Location

**Stock Data**: `C:\repos\StockMastery\Data\{Market}\{Symbol}\{Symbol}.ind`

**CSV Format**:
```csv
"Date","Open","High","Low","Close","AdjustedClose","Volume","Macd","MacdSignal","MacdHistogram","Sma200","Sma50","VolMA20","Rsi14"
"11/22/2024 00:00:00 +11:00","0.12","0.12","0.12","0.12","0.12","4729","","","","","","",""
```

---

## File Locations Reference

### Core Interfaces
- `IMarketDataProvider`: `src/Core/TradingStation.Contracts/IMarketDataProvider.cs`
- `IOrderExecutionService`: `src/Core/TradingStation.Contracts/IOrderExecutionService.cs`
- `IPositionManager`: `src/Core/TradingStation.Contracts/IPositionManager.cs`
- `IRiskManager`: `src/Core/TradingStation.Contracts/IRiskManager.cs`
- `IAccountManager`: `src/Core/TradingStation.Contracts/IAccountManager.cs`

### Trading Engine
- `OrderExecutionEngine`: `src/Core/TradingStation.TradingEngine/OrderExecutionEngine.cs`
- `PositionManager`: `src/Core/TradingStation.TradingEngine/PositionManager.cs`
- `RiskManager`: `src/Core/TradingStation.TradingEngine/RiskManager.cs`
- `AccountManager`: `src/Core/TradingStation.TradingEngine/AccountManager.cs`

### Temporal Safety
- `BacktestingMarketDataProvider`: `src/Infrastructure/TradingStation.Data.Backtesting/BacktestingMarketDataProvider.cs`
- `FutureDataAccessException`: Same file as above

### Database
- `TradingStationDbContext`: `src/Infrastructure/TradingStation.Infrastructure/Data/TradingStationDbContext.cs`
- Repositories: `src/Infrastructure/TradingStation.Infrastructure/Repositories/`

### Domain Entities
- `Stock`: `src/Core/TradingStation.Domain/Entities/Stock.cs`
- `StockPrice`: `src/Core/TradingStation.Domain/Entities/StockPrice.cs`
- `Indicator`: `src/Core/TradingStation.Domain/Entities/Indicator.cs`
- `TraderAccount`: `src/Core/TradingStation.Domain/Entities/TraderAccount.cs`
- `Position`: `src/Core/TradingStation.Domain/Entities/Position.cs`
- `Order`: `src/Core/TradingStation.Domain/Entities/Order.cs`

### Backtesting
- `BacktestRunner`: `src/Application/TradingStation.Backtesting/BacktestRunner.cs`
- `ITradingStrategy`: `src/Application/TradingStation.Backtesting/ITradingStrategy.cs`
- Strategies: `src/Application/TradingStation.Backtesting/Strategies/`

### API
- `Program.cs`: `src/Presentation/TradingStation.API/Program.cs`
- Controllers: `src/Presentation/TradingStation.API/Controllers/`

### Configuration
- Solution: `TradingStation.sln`
- Git ignore: `.gitignore`
- Claude settings: `.claude/settings.local.json`

### Documentation
- Implementation Guide: `IMPLEMENTATION_GUIDE.md`
- Implementation Status: `IMPLEMENTATION_STATUS.md`
- Full Specification: `Specs/FullSpecification.md`
- Architecture: `Specs/Architecture.md`
- Trading Engine Design: `Specs/TradingEngineArchitecture.md`
- Technology Stack: `Specs/TechnologyStack.md`
- NuGet Packages: `Specs/NuGetPackageRecommendations.md`

---

## Implementation Status

Refer to `IMPLEMENTATION_STATUS.md` for current progress.

**Completed** (100%):
- ✅ Solution structure and all projects created
- ✅ Contracts layer (all interfaces and DTOs)
- ✅ Domain layer (all entities)
- ✅ Trading Engine (OrderExecutionEngine, PositionManager, RiskManager, AccountManager)
- ✅ Infrastructure DbContext with EF Core configurations
- ✅ Temporal-safe BacktestingMarketDataProvider
- ✅ NuGet packages configured

**In Progress / To Complete**:
- ⏳ Infrastructure repositories implementation
- ⏳ Backtesting engine (BacktestRunner, strategies, performance metrics)
- ⏳ Application layer services (BacktestService, StockService)
- ⏳ API controllers and endpoints
- ⏳ Database migrations
- ⏳ Unit tests (especially temporal safety tests)
- ⏳ Frontend React application

---

## Quick Start for AI Assistants

When working with this codebase:

1. **Read First**: Review `Specs/FullSpecification.md` and `Specs/Architecture.md`
2. **Understand Temporal Safety**: This is the #1 architectural principle - never violate it
3. **Follow Onion Architecture**: Dependencies flow inward (Presentation → Application → Domain)
4. **Use Interfaces**: Never directly couple to implementations
5. **Test Temporal Safety**: Write tests for `FutureDataAccessException` scenarios
6. **Update Status**: Modify `IMPLEMENTATION_STATUS.md` when completing tasks
7. **Reference Specs**: Check specifications before implementing new features
8. **Maintain Conventions**: Follow C# standards and existing code patterns

---

## Support Resources

**Internal Documentation**:
- `IMPLEMENTATION_GUIDE.md` - Step-by-step implementation instructions
- `IMPLEMENTATION_STATUS.md` - Current progress and next steps
- `Specs/` folder - All detailed specifications

**External Resources**:
- [.NET 8 Documentation](https://learn.microsoft.com/en-us/dotnet/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [Skender Stock Indicators](https://github.com/DaveSkender/Stock.Indicators)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Last Updated**: 2025-11-23
**Version**: 1.0
**Maintained By**: Development Team & AI Assistants
