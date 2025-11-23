# Trading Engine - Reusable Trading Logic Architecture

## 1. Overview

The Trading Engine is extracted into a separate, reusable DLL that can be used for both **backtesting** and **live trading**. This separation ensures:
- Trading logic remains consistent across backtesting and production
- No code duplication
- Easy testing of strategies
- Prevention of future data leakage in backtesting

## 2. Project Structure

```
TradingStation.sln
├── Core/
│   ├── TradingStation.TradingEngine/           ← New: Reusable Trading Logic
│   ├── TradingStation.Domain/
│   └── TradingStation.Contracts/               ← New: Shared interfaces
├── Application/
│   ├── TradingStation.Backtesting/             ← New: Backtesting engine
│   ├── TradingStation.LiveTrading/             ← New: Live trading
│   └── TradingStation.Application/
├── Infrastructure/
│   ├── TradingStation.Infrastructure/
│   ├── TradingStation.Data.Backtesting/        ← New: Temporal data layer
│   └── TradingStation.Data.Live/               ← New: Live data layer
├── Presentation/
│   └── TradingStation.API/
└── Tests/
    ├── TradingStation.TradingEngine.Tests/
    └── TradingStation.Backtesting.Tests/
```

## 3. Trading Engine Core (TradingStation.TradingEngine)

### 3.1 Purpose
Provides **environment-agnostic** trading logic that works identically in backtesting and live trading.

### 3.2 Key Components

#### 3.2.1 Trading Engine Interface
```csharp
public interface ITradingEngine
{
    Task<OrderResult> ExecuteOrderAsync(Order order, IMarketDataProvider dataProvider);
    Task<Position> OpenPositionAsync(OpenPositionRequest request);
    Task<Position> ClosePositionAsync(ClosePositionRequest request);
    Task EvaluateStopLossesAsync(IEnumerable<Position> positions, IMarketDataProvider dataProvider);
    decimal CalculateProfitLoss(Position position, decimal currentPrice);
    bool ValidateOrder(Order order, TraderAccount account);
}
```

#### 3.2.2 Order Execution Engine
```csharp
public class OrderExecutionEngine : IOrderExecutionEngine
{
    private readonly IPositionManager _positionManager;
    private readonly IAccountManager _accountManager;
    private readonly IRiskManager _riskManager;

    public async Task<OrderResult> ExecuteAsync(
        Order order,
        IMarketDataProvider dataProvider,
        DateTime currentTime)
    {
        // 1. Validate order
        // 2. Get current price from data provider (respects time)
        // 3. Check account has sufficient funds
        // 4. Calculate commission
        // 5. Execute trade
        // 6. Update position
        // 7. Update account balance
        // 8. Return result
    }
}
```

#### 3.2.3 Position Manager
```csharp
public interface IPositionManager
{
    Task<Position> OpenPositionAsync(
        string symbol,
        decimal price,
        int quantity,
        DateTime timestamp,
        StopLossConfig stopLoss = null);

    Task<Position> ClosePositionAsync(
        Position position,
        decimal exitPrice,
        DateTime exitTime);

    IEnumerable<Position> GetOpenPositions(int accountId);
    decimal CalculateUnrealizedPL(Position position, decimal currentPrice);
}
```

#### 3.2.4 Risk Manager
```csharp
public interface IRiskManager
{
    bool ValidatePositionSize(Order order, TraderAccount account);
    bool ValidateMaxDrawdown(TraderAccount account);
    bool ValidateMaxPositions(int currentPositions, int maxAllowed);
    decimal CalculatePositionSize(decimal accountBalance, decimal riskPercent);
    StopLossResult EvaluateStopLoss(Position position, decimal currentPrice, DateTime currentTime);
}
```

#### 3.2.5 Account Manager
```csharp
public interface IAccountManager
{
    Task<bool> ReserveFundsAsync(int accountId, decimal amount);
    Task<bool> ReleaseFundsAsync(int accountId, decimal amount);
    Task UpdateBalanceAsync(int accountId, decimal profitLoss);
    Task<TraderAccount> GetAccountAsync(int accountId);
    decimal GetAvailableBalance(TraderAccount account);
}
```

### 3.3 Key Principles
1. **Time-aware**: All operations accept a `DateTime currentTime` parameter
2. **No direct data access**: Uses `IMarketDataProvider` abstraction
3. **Stateless**: All state managed through passed parameters
4. **Pure functions**: Where possible, use pure functions for calculations
5. **No I/O**: No file system or database access

## 4. Market Data Provider Abstraction (TradingStation.Contracts)

### 4.1 Interface Definition
```csharp
public interface IMarketDataProvider
{
    /// <summary>
    /// Gets the current price at the specified time.
    /// CRITICAL: Must respect temporal constraints in backtesting.
    /// </summary>
    Task<MarketPrice> GetPriceAsync(string symbol, DateTime asOfTime);

    /// <summary>
    /// Gets historical prices for a date range.
    /// CRITICAL: Cannot return data after 'endTime' in backtesting.
    /// </summary>
    Task<IEnumerable<StockPrice>> GetHistoricalPricesAsync(
        string symbol,
        DateTime startTime,
        DateTime endTime);

    /// <summary>
    /// Gets the current time in the trading environment.
    /// Backtesting: Returns simulation time
    /// Live: Returns real time
    /// </summary>
    DateTime GetCurrentTime();

    /// <summary>
    /// Checks if a symbol exists and has data at the specified time.
    /// </summary>
    Task<bool> IsSymbolAvailableAsync(string symbol, DateTime asOfTime);
}

public class MarketPrice
{
    public string Symbol { get; set; }
    public DateTime Timestamp { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
}
```

### 4.2 Why This Abstraction?
- **Same interface** for backtesting and live trading
- **Temporal safety**: Backtesting provider enforces no future data
- **Testability**: Easy to mock for unit tests
- **Flexibility**: Can swap data sources without changing trading logic

## 5. Backtesting Data Layer (TradingStation.Data.Backtesting)

### 5.1 Purpose
Provides a **time-constrained** implementation of `IMarketDataProvider` that prevents future data leakage.

### 5.2 Temporal Market Data Provider

```csharp
public class BacktestingMarketDataProvider : IMarketDataProvider
{
    private readonly IStockRepository _stockRepository;
    private DateTime _simulationTime;
    private readonly Dictionary<string, List<StockPrice>> _dataCache;

    public BacktestingMarketDataProvider(
        IStockRepository stockRepository,
        DateTime startTime)
    {
        _stockRepository = stockRepository;
        _simulationTime = startTime;
        _dataCache = new Dictionary<string, List<StockPrice>>();
    }

    /// <summary>
    /// Advances the simulation clock. CRITICAL for backtesting.
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
                $"Cannot access data from {asOfTime} when simulation time is {_simulationTime}");
        }

        // Get data up to asOfTime only
        var prices = await GetCachedPricesAsync(symbol);
        var price = prices
            .Where(p => p.Date <= asOfTime)
            .OrderByDescending(p => p.Date)
            .FirstOrDefault();

        if (price == null)
            throw new DataNotFoundException($"No data for {symbol} at {asOfTime}");

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

    public async Task<IEnumerable<StockPrice>> GetHistoricalPricesAsync(
        string symbol,
        DateTime startTime,
        DateTime endTime)
    {
        // CRITICAL: Cannot return data beyond simulation time
        var effectiveEndTime = endTime > _simulationTime ? _simulationTime : endTime;

        var prices = await GetCachedPricesAsync(symbol);

        return prices
            .Where(p => p.Date >= startTime && p.Date <= effectiveEndTime)
            .OrderBy(p => p.Date)
            .ToList();
    }

    private async Task<List<StockPrice>> GetCachedPricesAsync(string symbol)
    {
        if (!_dataCache.ContainsKey(symbol))
        {
            // Load ALL historical data (up to current simulation time)
            var allPrices = await _stockRepository.GetAllPricesAsync(symbol);
            _dataCache[symbol] = allPrices
                .Where(p => p.Date <= _simulationTime)
                .OrderBy(p => p.Date)
                .ToList();
        }

        return _dataCache[symbol];
    }
}
```

### 5.3 Future Data Leak Prevention

#### 5.3.1 Design Principles
1. **Simulation Clock**: Maintain internal time that advances explicitly
2. **Data Filtering**: All queries filter by `<= simulationTime`
3. **Exception on Violation**: Throw exception if future data requested
4. **Immutable Cache**: Once data loaded, it's time-filtered

#### 5.3.2 Example Protection
```csharp
// SAFE: Getting price at or before simulation time
var currentTime = dataProvider.GetCurrentTime(); // 2024-01-15
var price = await dataProvider.GetPriceAsync("AAPL", currentTime); // ✓ OK

// UNSAFE: Attempting to peek into future
var futurePrice = await dataProvider.GetPriceAsync("AAPL", currentTime.AddDays(1));
// ✗ Throws FutureDataAccessException
```

### 5.4 Indicator Access Control

```csharp
public interface IIndicatorProvider
{
    /// <summary>
    /// Gets indicators calculated ONLY from past data.
    /// </summary>
    Task<IndicatorValues> GetIndicatorsAsync(
        string symbol,
        DateTime asOfTime,
        IndicatorType[] requestedIndicators);
}

public class BacktestingIndicatorProvider : IIndicatorProvider
{
    private readonly IMarketDataProvider _dataProvider;

    public async Task<IndicatorValues> GetIndicatorsAsync(
        string symbol,
        DateTime asOfTime,
        IndicatorType[] requestedIndicators)
    {
        // Get historical data up to asOfTime
        var historicalPrices = await _dataProvider.GetHistoricalPricesAsync(
            symbol,
            asOfTime.AddYears(-2), // Enough history for indicators
            asOfTime);

        // Calculate indicators using ONLY past data
        var indicators = new IndicatorValues();

        if (requestedIndicators.Contains(IndicatorType.SMA200))
        {
            indicators.SMA200 = CalculateSMA(historicalPrices, 200);
        }

        if (requestedIndicators.Contains(IndicatorType.RSI14))
        {
            indicators.RSI14 = CalculateRSI(historicalPrices, 14);
        }

        // ... other indicators

        return indicators;
    }

    private decimal? CalculateSMA(IEnumerable<StockPrice> prices, int period)
    {
        var recentPrices = prices
            .OrderByDescending(p => p.Date)
            .Take(period)
            .ToList();

        if (recentPrices.Count < period)
            return null; // Not enough data

        return recentPrices.Average(p => p.Close);
    }
}
```

## 6. Live Trading Data Layer (TradingStation.Data.Live)

### 6.1 Live Market Data Provider
```csharp
public class LiveMarketDataProvider : IMarketDataProvider
{
    private readonly IExternalMarketDataApi _externalApi;
    private readonly IStockRepository _repository;

    public DateTime GetCurrentTime() => DateTime.UtcNow;

    public async Task<MarketPrice> GetPriceAsync(string symbol, DateTime asOfTime)
    {
        // In live trading, 'asOfTime' should always be <= current time
        if (asOfTime > DateTime.UtcNow)
        {
            throw new InvalidOperationException(
                "Cannot request future data in live trading");
        }

        // Get latest price from external API or database
        if (asOfTime.Date == DateTime.UtcNow.Date)
        {
            // Today's data - get from live API
            return await _externalApi.GetLatestPriceAsync(symbol);
        }
        else
        {
            // Historical data - get from database
            var price = await _repository.GetPriceAsync(symbol, asOfTime);
            return MapToMarketPrice(price);
        }
    }

    public async Task<IEnumerable<StockPrice>> GetHistoricalPricesAsync(
        string symbol,
        DateTime startTime,
        DateTime endTime)
    {
        // Load from database
        return await _repository.GetPricesInRangeAsync(symbol, startTime, endTime);
    }
}
```

## 7. Backtesting Engine (TradingStation.Backtesting)

### 7.1 Backtest Runner
```csharp
public class BacktestRunner
{
    private readonly ITradingEngine _tradingEngine;
    private readonly IBacktestingMarketDataProvider _dataProvider;
    private readonly IStrategy _strategy;

    public async Task<BacktestResult> RunAsync(BacktestConfig config)
    {
        // Initialize
        var account = CreateBacktestAccount(config.InitialCapital);
        var currentTime = config.StartDate;
        var positions = new List<Position>();
        var trades = new List<Trade>();

        // Main backtest loop
        while (currentTime <= config.EndDate)
        {
            // STEP 1: Advance simulation time
            _dataProvider.AdvanceTime(currentTime);

            // STEP 2: Evaluate stop losses (using time-constrained data)
            await EvaluateStopLossesAsync(positions, currentTime);

            // STEP 3: Get strategy signals (using time-constrained data)
            var signals = await _strategy.GenerateSignalsAsync(
                config.Symbols,
                _dataProvider);

            // STEP 4: Execute trades
            foreach (var signal in signals)
            {
                var order = signal.ToOrder(account.Id);
                var result = await _tradingEngine.ExecuteOrderAsync(
                    order,
                    _dataProvider);

                if (result.IsSuccess)
                {
                    trades.Add(result.Trade);

                    if (signal.Action == SignalAction.Buy)
                        positions.Add(result.Position);
                    else
                        positions.Remove(result.Position);
                }
            }

            // STEP 5: Record account state
            RecordAccountSnapshot(account, currentTime);

            // STEP 6: Advance to next time period
            currentTime = GetNextTradingDay(currentTime);
        }

        // Return results
        return new BacktestResult
        {
            Account = account,
            Trades = trades,
            Metrics = CalculateMetrics(trades, account),
            EquityCurve = GetEquityCurve()
        };
    }

    private async Task EvaluateStopLossesAsync(
        List<Position> positions,
        DateTime currentTime)
    {
        foreach (var position in positions.Where(p => p.IsOpen).ToList())
        {
            // Get current price (respects temporal constraint)
            var currentPrice = await _dataProvider.GetPriceAsync(
                position.Symbol,
                currentTime);

            // Evaluate stop loss
            var stopLossResult = _riskManager.EvaluateStopLoss(
                position,
                currentPrice.Close,
                currentTime);

            if (stopLossResult.ShouldTrigger)
            {
                await _tradingEngine.ClosePositionAsync(
                    new ClosePositionRequest
                    {
                        Position = position,
                        ExitPrice = currentPrice.Close,
                        ExitTime = currentTime,
                        Reason = stopLossResult.Reason
                    });

                positions.Remove(position);
            }
        }
    }
}
```

### 7.2 Strategy Interface
```csharp
public interface IStrategy
{
    string Name { get; }
    string Description { get; }

    /// <summary>
    /// Generates trading signals based on available data.
    /// Data provider enforces temporal constraints.
    /// </summary>
    Task<IEnumerable<TradingSignal>> GenerateSignalsAsync(
        IEnumerable<string> symbols,
        IMarketDataProvider dataProvider);
}

public class TradingSignal
{
    public string Symbol { get; set; }
    public SignalAction Action { get; set; } // Buy, Sell, Hold
    public decimal Confidence { get; set; }
    public string Reason { get; set; }
    public StopLossConfig StopLoss { get; set; }
}
```

### 7.3 Example Strategy Implementation
```csharp
public class MovingAverageCrossoverStrategy : IStrategy
{
    public string Name => "MA Crossover";

    public async Task<IEnumerable<TradingSignal>> GenerateSignalsAsync(
        IEnumerable<string> symbols,
        IMarketDataProvider dataProvider)
    {
        var signals = new List<TradingSignal>();
        var currentTime = dataProvider.GetCurrentTime();

        foreach (var symbol in symbols)
        {
            // Get historical prices (automatically time-constrained)
            var prices = await dataProvider.GetHistoricalPricesAsync(
                symbol,
                currentTime.AddMonths(-12),
                currentTime);

            // Calculate indicators from historical data only
            var sma50 = CalculateSMA(prices, 50);
            var sma200 = CalculateSMA(prices, 200);

            if (sma50 == null || sma200 == null)
                continue; // Not enough data

            // Generate signal
            if (sma50 > sma200)
            {
                signals.Add(new TradingSignal
                {
                    Symbol = symbol,
                    Action = SignalAction.Buy,
                    Confidence = 0.7m,
                    Reason = "SMA50 crossed above SMA200",
                    StopLoss = new StopLossConfig
                    {
                        Type = StopLossType.Percentage,
                        Value = 0.05m // 5% stop loss
                    }
                });
            }
            else if (sma50 < sma200)
            {
                signals.Add(new TradingSignal
                {
                    Symbol = symbol,
                    Action = SignalAction.Sell,
                    Confidence = 0.7m,
                    Reason = "SMA50 crossed below SMA200"
                });
            }
        }

        return signals;
    }
}
```

## 8. Preventing Future Data Leakage - Best Practices

### 8.1 Code Review Checklist
- ✓ All data access goes through `IMarketDataProvider`
- ✓ No direct repository access in strategy code
- ✓ All indicator calculations use historical data only
- ✓ No sorting by future dates
- ✓ No `DateTime.Now` in backtesting code
- ✓ Unit tests verify temporal constraints

### 8.2 Testing for Data Leakage
```csharp
[Fact]
public async Task BacktestingDataProvider_ShouldThrow_WhenAccessingFutureData()
{
    // Arrange
    var simulationTime = new DateTime(2024, 1, 15);
    var provider = new BacktestingMarketDataProvider(_repository, simulationTime);
    var futureTime = simulationTime.AddDays(1);

    // Act & Assert
    await Assert.ThrowsAsync<FutureDataAccessException>(
        () => provider.GetPriceAsync("AAPL", futureTime));
}

[Fact]
public async Task BacktestingDataProvider_ShouldReturnFilteredData_WhenRequestingRange()
{
    // Arrange
    var simulationTime = new DateTime(2024, 1, 15);
    var provider = new BacktestingMarketDataProvider(_repository, simulationTime);

    // Act - Request data including future dates
    var prices = await provider.GetHistoricalPricesAsync(
        "AAPL",
        new DateTime(2024, 1, 1),
        new DateTime(2024, 1, 31)); // Future date

    // Assert - Should only return data up to simulation time
    Assert.All(prices, p => Assert.True(p.Date <= simulationTime));
}
```

## 9. Benefits of This Architecture

### 9.1 For Backtesting
- ✓ **No future data leakage**: Enforced at the data layer
- ✓ **Realistic simulation**: Same code as live trading
- ✓ **Reproducible results**: Deterministic given same inputs
- ✓ **Fast iteration**: Test strategies quickly

### 9.2 For Live Trading
- ✓ **Proven logic**: Already tested in backtesting
- ✓ **No surprises**: Behavior matches backtesting
- ✓ **Easy deployment**: Same interfaces
- ✓ **Confidence**: Know it works as expected

### 9.3 For Development
- ✓ **Testability**: Easy to mock data provider
- ✓ **Separation of concerns**: Trading logic isolated
- ✓ **Reusability**: Use engine in multiple contexts
- ✓ **Maintainability**: Changes in one place

## 10. Project Dependencies

```
TradingStation.TradingEngine (Core Trading Logic)
├── No external dependencies (pure logic)
└── References: TradingStation.Contracts, TradingStation.Domain

TradingStation.Contracts (Shared Interfaces)
├── No dependencies
└── Defines: IMarketDataProvider, IIndicatorProvider, etc.

TradingStation.Data.Backtesting
├── References: TradingStation.Contracts, TradingStation.Domain
└── Implements: IMarketDataProvider with temporal constraints

TradingStation.Data.Live
├── References: TradingStation.Contracts, TradingStation.Domain
└── Implements: IMarketDataProvider for live data

TradingStation.Backtesting
├── References: TradingStation.TradingEngine, TradingStation.Data.Backtesting
└── Orchestrates backtesting runs

TradingStation.LiveTrading
├── References: TradingStation.TradingEngine, TradingStation.Data.Live
└── Orchestrates live trading

TradingStation.API
├── References: TradingStation.Application, TradingStation.Backtesting
└── Exposes REST API and SignalR hubs
```

## 11. Usage Example

### 11.1 Backtesting
```csharp
// Setup
var dataProvider = new BacktestingMarketDataProvider(stockRepository, startDate);
var tradingEngine = new TradingEngine(positionManager, accountManager, riskManager);
var strategy = new MovingAverageCrossoverStrategy();
var backtester = new BacktestRunner(tradingEngine, dataProvider, strategy);

// Run backtest
var config = new BacktestConfig
{
    StartDate = new DateTime(2020, 1, 1),
    EndDate = new DateTime(2023, 12, 31),
    InitialCapital = 100000m,
    Symbols = new[] { "AAPL", "MSFT", "GOOGL" }
};

var result = await backtester.RunAsync(config);

// Analyze results
Console.WriteLine($"Total Return: {result.Metrics.TotalReturn:P2}");
Console.WriteLine($"Win Rate: {result.Metrics.WinRate:P2}");
Console.WriteLine($"Max Drawdown: {result.Metrics.MaxDrawdown:P2}");
```

### 11.2 Live Trading
```csharp
// Setup
var dataProvider = new LiveMarketDataProvider(externalApi, stockRepository);
var tradingEngine = new TradingEngine(positionManager, accountManager, riskManager);
var strategy = new MovingAverageCrossoverStrategy(); // Same strategy!

// Execute in real-time
var liveTrader = new LiveTradingEngine(tradingEngine, dataProvider, strategy);
await liveTrader.StartAsync();
```

This architecture ensures that **the same trading logic** runs in both environments, with temporal safety enforced by the data layer abstraction.
