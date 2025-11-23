# Trading Station - Implementation Guide

## Project Status

### ✅ Completed

1. **Solution Structure** - All projects created and added to solution
2. **Contracts Layer** - Core interfaces implemented
3. **Domain Layer** - Entity models created

### 🚧 To Implement

This guide provides step-by-step instructions for implementing the remaining components.

---

## Solution Structure

```
TradingStation.sln
├── src/
│   ├── Core/
│   │   ├── TradingStation.Contracts/          ✅ DONE
│   │   ├── TradingStation.Domain/             ✅ DONE (entities)
│   │   └── TradingStation.TradingEngine/      ⏳ TODO
│   ├── Application/
│   │   ├── TradingStation.Application/        ⏳ TODO
│   │   └── TradingStation.Backtesting/        ⏳ TODO
│   ├── Infrastructure/
│   │   ├── TradingStation.Infrastructure/     ⏳ TODO
│   │   └── TradingStation.Data.Backtesting/   ⏳ TODO
│   └── Presentation/
│       └── TradingStation.API/                ⏳ TODO
└── tests/
    ├── TradingStation.UnitTests/              ⏳ TODO
    └── TradingStation.TradingEngine.Tests/    ⏳ TODO
```

---

## Step 1: Add Project References

### TradingEngine Dependencies
```bash
cd src/Core/TradingStation.TradingEngine
dotnet add reference ../TradingStation.Contracts/TradingStation.Contracts.csproj
dotnet add reference ../TradingStation.Domain/TradingStation.Domain.csproj
dotnet add package Microsoft.Extensions.Logging.Abstractions --version 8.0.0
```

### Infrastructure Dependencies
```bash
cd ../../Infrastructure/TradingStation.Infrastructure
dotnet add reference ../../Core/TradingStation.Domain/TradingStation.Domain.csproj
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 8.0.0
dotnet add package CsvHelper --version 30.0.1
dotnet add package Skender.Stock.Indicators --version 2.7.0
dotnet add package Microsoft.Extensions.Caching.Memory --version 8.0.0
```

### Data.Backtesting Dependencies
```bash
cd ../TradingStation.Data.Backtesting
dotnet add reference ../../Core/TradingStation.Contracts/TradingStation.Contracts.csproj
dotnet add reference ../../Core/TradingStation.Domain/TradingStation.Domain.csproj
dotnet add reference ../TradingStation.Infrastructure/TradingStation.Infrastructure.csproj
dotnet add package Microsoft.Extensions.Caching.Memory --version 8.0.0
```

### Application Dependencies
```bash
cd ../../Application/TradingStation.Application
dotnet add reference ../../Core/TradingStation.Domain/TradingStation.Domain.csproj
dotnet add reference ../../Infrastructure/TradingStation.Infrastructure/TradingStation.Infrastructure.csproj
dotnet add package AutoMapper --version 12.0.1
dotnet add package FluentValidation --version 11.9.0
```

### Backtesting Dependencies
```bash
cd ../TradingStation.Backtesting
dotnet add reference ../../Core/TradingStation.Contracts/TradingStation.Contracts.csproj
dotnet add reference ../../Core/TradingStation.Domain/TradingStation.Domain.csproj
dotnet add reference ../../Core/TradingStation.TradingEngine/TradingStation.TradingEngine.csproj
dotnet add reference ../../Infrastructure/TradingStation.Data.Backtesting/TradingStation.Data.Backtesting.csproj
dotnet add package MathNet.Numerics --version 5.0.0
```

### API Dependencies
```bash
cd ../../Presentation/TradingStation.API
dotnet add reference ../../Application/TradingStation.Application/TradingStation.Application.csproj
dotnet add reference ../../Application/TradingStation.Backtesting/TradingStation.Backtesting.csproj
dotnet add package Serilog.AspNetCore --version 8.0.0
dotnet add package Swashbuckle.AspNetCore --version 6.5.0
```

---

## Step 2: Implement Trading Engine

### File: TradingEngine/OrderExecutionEngine.cs

```csharp
using TradingStation.Contracts;
using TradingStation.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace TradingStation.TradingEngine;

public class OrderExecutionEngine : IOrderExecutionService
{
    private readonly IPositionManager _positionManager;
    private readonly IAccountManager _accountManager;
    private readonly IRiskManager _riskManager;
    private readonly ILogger<OrderExecutionEngine> _logger;

    public OrderExecutionEngine(
        IPositionManager positionManager,
        IAccountManager accountManager,
        IRiskManager riskManager,
        ILogger<OrderExecutionEngine> logger)
    {
        _positionManager = positionManager;
        _accountManager = accountManager;
        _riskManager = riskManager;
        _logger = logger;
    }

    public async Task<OrderResult> ExecuteOrderAsync(
        OrderRequest order,
        IMarketDataProvider dataProvider,
        DateTime currentTime)
    {
        try
        {
            // 1. Get account
            var account = await _accountManager.GetAccountAsync(order.AccountId);

            // 2. Validate order
            var validation = await _riskManager.ValidateOrderAsync(order, account);
            if (!validation.IsValid)
            {
                return new OrderResult
                {
                    IsSuccess = false,
                    ErrorMessage = validation.ErrorMessage
                };
            }

            // 3. Get current price (respects temporal constraints)
            var priceData = await dataProvider.GetPriceAsync(order.Symbol, currentTime);
            var executionPrice = priceData.Close;

            // 4. Calculate cost/proceeds
            var totalCost = executionPrice * order.Quantity;
            var commission = CalculateCommission(order.Quantity, executionPrice);

            // 5. Execute based on order type
            if (order.OrderType == OrderType.Buy)
            {
                // Check funds
                if (!await _accountManager.ReserveFundsAsync(account.Id, totalCost + commission))
                {
                    return new OrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Insufficient funds"
                    };
                }

                // Open position
                var position = await _positionManager.OpenPositionAsync(
                    account.Id,
                    order.Symbol,
                    executionPrice,
                    order.Quantity,
                    currentTime,
                    order.StopLoss);

                return new OrderResult
                {
                    IsSuccess = true,
                    PositionId = position.Id,
                    ExecutionPrice = executionPrice,
                    Commission = commission,
                    ExecutionTime = currentTime
                };
            }
            else // Sell
            {
                // Find open position
                var openPositions = await _positionManager.GetOpenPositionsAsync(account.Id);
                var position = openPositions.FirstOrDefault(p => p.Symbol == order.Symbol);

                if (position == null)
                {
                    return new OrderResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"No open position for {order.Symbol}"
                    };
                }

                // Close position
                var closedPosition = await _positionManager.ClosePositionAsync(
                    position.Id,
                    executionPrice,
                    currentTime,
                    "User requested");

                // Update account
                var proceeds = executionPrice * order.Quantity;
                await _accountManager.UpdateBalanceAsync(account.Id, closedPosition.RealizedPL!.Value - commission);

                return new OrderResult
                {
                    IsSuccess = true,
                    PositionId = closedPosition.Id,
                    ExecutionPrice = executionPrice,
                    Commission = commission,
                    ExecutionTime = currentTime
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing order");
            return new OrderResult
            {
                IsSuccess = false,
                ErrorMessage = ex.Message
            };
        }
    }

    private decimal CalculateCommission(int quantity, decimal price)
    {
        // Simple commission model: $5 per trade
        return 5.00m;
    }
}
```

---

## Step 3: Implement Data.Backtesting (Temporal Safety)

### File: Data.Backtesting/BacktestingMarketDataProvider.cs

```csharp
using TradingStation.Contracts;
using Microsoft.Extensions.Caching.Memory;

namespace TradingStation.Data.Backtesting;

public class BacktestingMarketDataProvider : IMarketDataProvider
{
    private DateTime _simulationTime;
    private readonly IMemoryCache _cache;
    private readonly IStockRepository _stockRepository;

    public BacktestingMarketDataProvider(
        IStockRepository stockRepository,
        DateTime startTime,
        IMemoryCache cache)
    {
        _stockRepository = stockRepository;
        _simulationTime = startTime;
        _cache = cache;
    }

    /// <summary>
    /// CRITICAL: Advances simulation time. Must be called explicitly.
    /// </summary>
    public void AdvanceTime(DateTime newTime)
    {
        if (newTime < _simulationTime)
            throw new InvalidOperationException("Cannot move backward in time");

        _simulationTime = newTime;
    }

    public DateTime GetCurrentTime() => _simulationTime;

    public async Task<MarketPrice> GetPriceAsync(string symbol, DateTime asOfTime)
    {
        // CRITICAL: Enforce temporal constraint
        if (asOfTime > _simulationTime)
        {
            throw new FutureDataAccessException(
                $"Cannot access data from {asOfTime:yyyy-MM-dd} when simulation time is {_simulationTime:yyyy-MM-dd}");
        }

        var prices = await GetCachedPricesAsync(symbol);

        var price = prices
            .Where(p => p.Date <= asOfTime)
            .OrderByDescending(p => p.Date)
            .FirstOrDefault();

        if (price == null)
            throw new DataNotFoundException($"No data for {symbol} at {asOfTime:yyyy-MM-dd}");

        return new MarketPrice
        {
            Symbol = symbol,
            Timestamp = price.Date,
            Open = price.Open,
            High = price.High,
            Low = price.Low,
            Close = price.Close,
            Volume = price.Volume
        };
    }

    public async Task<IEnumerable<StockPriceData>> GetHistoricalPricesAsync(
        string symbol,
        DateTime startTime,
        DateTime endTime)
    {
        // CRITICAL: Cannot return data beyond simulation time
        var effectiveEndTime = endTime > _simulationTime ? _simulationTime : endTime;

        var prices = await GetCachedPricesAsync(symbol);

        return prices
            .Where(p => p.Date >= startTime && p.Date <= effectiveEndTime)
            .OrderBy(p => p.Date);
    }

    public async Task<bool> IsSymbolAvailableAsync(string symbol, DateTime asOfTime)
    {
        try
        {
            await GetPriceAsync(symbol, asOfTime);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task<List<StockPriceData>> GetCachedPricesAsync(string symbol)
    {
        var cacheKey = $"backtest_prices_{symbol}";

        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);

            // Load all historical data up to simulation time
            var prices = await _stockRepository.GetAllPricesAsync(symbol);

            return prices
                .Where(p => p.Date <= _simulationTime)
                .OrderBy(p => p.Date)
                .ToList();
        });
    }
}

/// <summary>
/// Exception thrown when attempting to access future data in backtesting
/// </summary>
public class FutureDataAccessException : Exception
{
    public FutureDataAccessException(string message) : base(message) { }
}

/// <summary>
/// Exception thrown when data is not found
/// </summary>
public class DataNotFoundException : Exception
{
    public DataNotFoundException(string message) : base(message) { }
}
```

---

## Step 4: Implement Infrastructure (DbContext)

### File: Infrastructure/Data/TradingStationDbContext.cs

```csharp
using Microsoft.EntityFrameworkCore;
using TradingStation.Domain.Entities;

namespace TradingStation.Infrastructure.Data;

public class TradingStationDbContext : DbContext
{
    public TradingStationDbContext(DbContextOptions<TradingStationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<StockPrice> StockPrices => Set<StockPrice>();
    public DbSet<Indicator> Indicators => Set<Indicator>();
    public DbSet<TraderAccount> TraderAccounts => Set<TraderAccount>();
    public DbSet<Position> Positions => Set<Position>();
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Stock configuration
        modelBuilder.Entity<Stock>(entity =>
        {
            entity.HasKey(e => e.Symbol);
            entity.Property(e => e.Symbol).HasMaxLength(10);
            entity.Property(e => e.Market).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Sector).HasMaxLength(50);

            entity.HasIndex(e => e.Market);
        });

        // StockPrice configuration
        modelBuilder.Entity<StockPrice>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Symbol).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Open).HasColumnType("decimal(18,4)");
            entity.Property(e => e.High).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Low).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Close).HasColumnType("decimal(18,4)");
            entity.Property(e => e.AdjustedClose).HasColumnType("decimal(18,4)");

            entity.HasIndex(e => new { e.Symbol, e.Date }).IsUnique();
            entity.HasIndex(e => e.Date);

            entity.HasOne(e => e.Stock)
                .WithMany(s => s.Prices)
                .HasForeignKey(e => e.Symbol);
        });

        // Indicator configuration
        modelBuilder.Entity<Indicator>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Macd).HasColumnType("decimal(18,8)");
            entity.Property(e => e.MacdSignal).HasColumnType("decimal(18,8)");
            entity.Property(e => e.MacdHistogram).HasColumnType("decimal(18,8)");
            entity.Property(e => e.Sma200).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Sma50).HasColumnType("decimal(18,4)");
            entity.Property(e => e.VolMA20).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Rsi14).HasColumnType("decimal(18,4)");

            entity.HasOne(e => e.StockPrice)
                .WithOne(sp => sp.Indicator)
                .HasForeignKey<Indicator>(e => e.StockPriceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TraderAccount configuration
        modelBuilder.Entity<TraderAccount>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.InitialCapital).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CurrentCash).HasColumnType("decimal(18,2)");
        });

        // Position configuration
        modelBuilder.Entity<Position>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Symbol).HasMaxLength(10).IsRequired();
            entity.Property(e => e.EntryPrice).HasColumnType("decimal(18,4)");
            entity.Property(e => e.ExitPrice).HasColumnType("decimal(18,4)");
            entity.Property(e => e.StopLossPrice).HasColumnType("decimal(18,4)");
            entity.Property(e => e.RealizedPL).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ExitReason).HasMaxLength(200);

            entity.HasIndex(e => new { e.AccountId, e.Status });

            entity.HasOne(e => e.Account)
                .WithMany(a => a.Positions)
                .HasForeignKey(e => e.AccountId);
        });

        // Order configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Symbol).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Price).HasColumnType("decimal(18,4)");

            entity.HasIndex(e => new { e.AccountId, e.Status });

            entity.HasOne(e => e.Account)
                .WithMany(a => a.Orders)
                .HasForeignKey(e => e.AccountId);
        });
    }
}
```

---

## Step 5: Create Initial Migration

```bash
cd src/Presentation/TradingStation.API
dotnet ef migrations add InitialCreate --project ../../Infrastructure/TradingStation.Infrastructure/TradingStation.Infrastructure.csproj
dotnet ef database update --project ../../Infrastructure/TradingStation.Infrastructure/TradingStation.Infrastructure.csproj
```

---

## Step 6: Configure Dependency Injection in Program.cs

```csharp
using Microsoft.EntityFrameworkCore;
using TradingStation.Infrastructure.Data;
using TradingStation.Contracts;
using TradingStation.TradingEngine;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<TradingStationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Caching
builder.Services.AddMemoryCache();

// Trading Engine (Reusable)
builder.Services.AddScoped<IOrderExecutionService, OrderExecutionEngine>();
builder.Services.AddScoped<IPositionManager, PositionManager>();
builder.Services.AddScoped<IRiskManager, RiskManager>();
builder.Services.AddScoped<IAccountManager, AccountManager>();

// Add controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## Next Steps

1. **Implement remaining managers** (PositionManager, RiskManager, AccountManager)
2. **Implement repositories** in Infrastructure layer
3. **Implement CSV file reader** for .ind files
4. **Implement Backtesting engine** (BacktestRunner, Strategy interface)
5. **Implement Application services**
6. **Create API controllers**
7. **Write unit tests** for critical components (especially temporal safety)
8. **Implement React frontend** based on specs

## Running the Application

```bash
# Build solution
dotnet build

# Run tests
dotnet test

# Run API
cd src/Presentation/TradingStation.API
dotnet run
```

## Important Notes

- **Temporal Safety**: All backtesting data access MUST go through `BacktestingMarketDataProvider`
- **Test Coverage**: Write tests for `FutureDataAccessException` scenarios
- **Commission Model**: Update `CalculateCommission()` based on requirements
- **Error Handling**: Add global exception handling middleware

Refer to the specification documents in the `Specs/` folder for detailed requirements.
