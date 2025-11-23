# Trading Station - NuGet Package Recommendations

## Executive Summary

This document provides research-backed recommendations for ready-made NuGet packages that can accelerate development of the Trading Station platform. Using established libraries reduces development time, improves reliability, and provides battle-tested implementations.

## 1. Technical Indicators

### 🏆 Recommended: Skender.Stock.Indicators

**NuGet Package:** `Skender.Stock.Indicators` (v2.7.0+)

**Why Choose This:**
- ✅ **Most comprehensive** - Over 150+ technical indicators
- ✅ **Actively maintained** - Last updated December 2024
- ✅ **High performance** - No external dependencies
- ✅ **Popular** - 5M+ total downloads, 2.3K/day average
- ✅ **Modern** - Supports .NET 8.0, .NET Standard 2.0
- ✅ **Well documented** - Excellent documentation at [dotnet.stockindicators.dev](https://dotnet.stockindicators.dev/)
- ✅ **Real-time support** - v3 includes streaming capabilities

**Installation:**
```bash
dotnet add package Skender.Stock.Indicators
```

**Supported Indicators (Our Requirements):**
- ✓ MACD (Moving Average Convergence Divergence)
- ✓ RSI (Relative Strength Index)
- ✓ SMA (Simple Moving Average) - all periods
- ✓ Volume Moving Average
- ✓ 150+ other indicators

**Usage Example:**
```csharp
using Skender.Stock.Indicators;

// Your stock data
var quotes = new List<Quote>
{
    new Quote { Date = DateTime.Parse("2024-01-01"), Open = 100, High = 105, Low = 99, Close = 103, Volume = 100000 },
    // ... more quotes
};

// Calculate MACD
var macdResults = quotes.GetMacd(12, 26, 9);

// Calculate RSI
var rsiResults = quotes.GetRsi(14);

// Calculate SMA
var sma50Results = quotes.GetSma(50);
var sma200Results = quotes.GetSma(200);

// Calculate Volume SMA
var volumeSmaResults = quotes.GetSma(20);
```

**Integration with Our Architecture:**
```csharp
// In BacktestingIndicatorProvider or IndicatorService
public class IndicatorService : IIndicatorProvider
{
    public async Task<IndicatorValues> GetIndicatorsAsync(
        string symbol,
        DateTime asOfTime,
        IndicatorType[] requestedIndicators)
    {
        // Get historical prices up to asOfTime (respects temporal constraints)
        var prices = await _dataProvider.GetHistoricalPricesAsync(
            symbol,
            asOfTime.AddYears(-2),
            asOfTime);

        // Convert to Skender Quote format
        var quotes = prices.Select(p => new Quote
        {
            Date = p.Date,
            Open = p.Open,
            High = p.High,
            Low = p.Low,
            Close = p.Close,
            Volume = p.Volume
        }).ToList();

        var indicators = new IndicatorValues();

        if (requestedIndicators.Contains(IndicatorType.MACD))
        {
            var macd = quotes.GetMacd().LastOrDefault();
            indicators.Macd = macd?.Macd;
            indicators.MacdSignal = macd?.Signal;
            indicators.MacdHistogram = macd?.Histogram;
        }

        if (requestedIndicators.Contains(IndicatorType.RSI14))
        {
            var rsi = quotes.GetRsi(14).LastOrDefault();
            indicators.Rsi14 = rsi?.Rsi;
        }

        if (requestedIndicators.Contains(IndicatorType.SMA200))
        {
            var sma = quotes.GetSma(200).LastOrDefault();
            indicators.Sma200 = sma?.Sma;
        }

        return indicators;
    }
}
```

**Pros:**
- Battle-tested in production systems
- Excellent performance (no dependencies)
- Comprehensive indicator library
- Chain-able for complex analysis
- Regular updates and bug fixes

**Cons:**
- Need to convert our data format to Quote format (minimal overhead)
- Some advanced indicators may need custom configuration

**License:** Apache 2.0 (Free for commercial use)

---

### Alternative: OoplesFinance.StockIndicators

**NuGet Package:** `OoplesFinance.StockIndicators`

**Features:**
- 763+ stock indicators
- Apache 2.0 license
- Method chaining support

**When to Use:**
- If you need very specialized indicators not in Skender
- If you want method chaining for complex calculations

---

## 2. Backtesting Framework

### 🏆 Recommended: Build Custom + Use Components

**Recommendation:** Build our own backtesting framework as specified in [TradingEngineArchitecture.md](TradingEngineArchitecture.md), but leverage components from existing frameworks.

**Why Custom Framework:**
- ✅ **Temporal safety** - Full control over future data prevention
- ✅ **Learning** - Understanding of backtesting internals
- ✅ **Flexibility** - Tailored to our exact requirements
- ✅ **Simplicity** - No overhead from unused features
- ✅ **Integration** - Perfect fit with our architecture

**Components to Borrow From:**

#### QuantConnect LEAN (Reference Architecture)
**GitHub:** [QuantConnect/Lean](https://github.com/QuantConnect/Lean)

**Use For:**
- ✓ Architecture patterns
- ✓ Order execution logic
- ✓ Position management patterns
- ✓ Performance metrics calculations

**Don't Use Directly Because:**
- ✗ Too complex for our needs (supports live trading, multiple brokers)
- ✗ Heavy dependencies
- ✗ Cloud-focused architecture
- ✗ Steep learning curve

**Learn From:**
```csharp
// Study their approach to:
// - Order filling algorithms
// - Commission models
// - Slippage simulation
// - Portfolio management
```

---

#### SimpleBacktestLib (Lightweight Inspiration)
**GitHub:** [NotCoffee418/SimpleBacktestLib](https://github.com/NotCoffee418/SimpleBacktestLib)

**Use For:**
- ✓ Simple backtest loop structure
- ✓ Basic performance metrics
- ✓ Minimal dependencies approach

**Adapt For Our Use:**
```csharp
// Adapt their backtest loop structure with our temporal constraints
public async Task<BacktestResult> RunAsync(BacktestConfig config)
{
    var currentTime = config.StartDate;

    while (currentTime <= config.EndDate)
    {
        _dataProvider.AdvanceTime(currentTime); // Our addition

        // Process signals, execute orders (their pattern)

        currentTime = GetNextTradingDay(currentTime);
    }
}
```

---

## 3. Financial Calculations & Math

### 🏆 Recommended: Math.NET Numerics

**NuGet Package:** `MathNet.Numerics` (v5.0.0)

**Why Choose This:**
- ✅ Free and open source (MIT License)
- ✅ Well-established (10+ years)
- ✅ Comprehensive math library
- ✅ .NET 8.0, .NET Standard 2.0 support
- ✅ Excellent documentation

**Installation:**
```bash
dotnet add package MathNet.Numerics
```

**Use Cases in Trading Station:**

#### 1. Statistical Analysis
```csharp
using MathNet.Numerics.Statistics;

// Calculate Sharpe Ratio
public decimal CalculateSharpeRatio(List<decimal> returns, decimal riskFreeRate)
{
    var returnsArray = returns.Select(r => (double)r).ToArray();
    var mean = returnsArray.Mean();
    var stdDev = returnsArray.StandardDeviation();

    return (decimal)((mean - (double)riskFreeRate) / stdDev);
}

// Calculate Maximum Drawdown
public decimal CalculateMaxDrawdown(List<decimal> equityCurve)
{
    var equity = equityCurve.Select(e => (double)e).ToArray();
    var runningMax = equity[0];
    var maxDrawdown = 0.0;

    foreach (var value in equity)
    {
        runningMax = Math.Max(runningMax, value);
        var drawdown = (runningMax - value) / runningMax;
        maxDrawdown = Math.Max(maxDrawdown, drawdown);
    }

    return (decimal)maxDrawdown;
}
```

#### 2. Portfolio Optimization (Future)
```csharp
using MathNet.Numerics.LinearAlgebra;
using MathNet.Numerics.Optimization;

// Optimize portfolio weights to minimize risk for target return
public Vector<double> OptimizePortfolio(
    Matrix<double> covarianceMatrix,
    Vector<double> expectedReturns,
    double targetReturn)
{
    // Use quadratic programming for portfolio optimization
    // Reference: https://numerics.net/blog/using-quadratic-programming-for-portfolio-optimization-2
}
```

#### 3. Linear Regression for Trend Analysis
```csharp
using MathNet.Numerics;

// Fit linear trend to price data
var xData = Enumerable.Range(0, prices.Count).Select(i => (double)i).ToArray();
var yData = prices.Select(p => (double)p.Close).ToArray();

var (intercept, slope) = Fit.Line(xData, yData);
```

**Integration Example:**
```csharp
// In PerformanceMetricsCalculator.cs
public class PerformanceMetricsCalculator
{
    public PerformanceMetrics Calculate(List<Trade> trades, List<EquityPoint> equityCurve)
    {
        var returns = CalculateReturns(trades);

        return new PerformanceMetrics
        {
            TotalReturn = trades.Sum(t => t.ProfitLoss),
            WinRate = (decimal)trades.Count(t => t.ProfitLoss > 0) / trades.Count,
            SharpeRatio = CalculateSharpeRatio(returns, 0.02m), // Using Math.NET
            MaxDrawdown = CalculateMaxDrawdown(equityCurve.Select(e => e.Value).ToList()),
            // ... other metrics
        };
    }
}
```

**Pros:**
- Industry-standard algorithms
- High performance
- Extensively tested
- Good documentation

**Cons:**
- Some learning curve for advanced features
- Overkill for simple calculations (use built-in Math class)

---

### Alternative: QLNet (For Advanced Financial Models)

**NuGet Package:** `QLNet` (v1.13.1)

**When to Use:**
- Options pricing (future feature)
- Interest rate modeling
- Bond calculations
- Complex derivatives

**Not Needed For:**
- Basic stock trading backtesting
- Simple technical analysis

**Recommendation:** Skip for now, consider for future enhancements.

---

## 4. CSV Parsing

### 🏆 Recommended: CsvHelper

**NuGet Package:** `CsvHelper` (v30.0.1)

**Why Choose This:**
- ✅ **Most popular** - Industry standard for C# CSV parsing
- ✅ **Feature-rich** - Handles edge cases, type conversion, mapping
- ✅ **Easy to use** - Excellent developer ergonomics
- ✅ **Well maintained** - Active development
- ✅ **Good documentation** - Comprehensive guides
- ✅ **Flexible** - Supports custom mappings, formats

**Installation:**
```bash
dotnet add package CsvHelper
```

**Usage for Our .ind Files:**
```csharp
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

public class StockPriceMap : ClassMap<StockPrice>
{
    public StockPriceMap()
    {
        Map(m => m.Date).Name("Date");
        Map(m => m.Open).Name("Open");
        Map(m => m.High).Name("High");
        Map(m => m.Low).Name("Low");
        Map(m => m.Close).Name("Close");
        Map(m => m.AdjustedClose).Name("AdjustedClose");
        Map(m => m.Volume).Name("Volume");
    }
}

public class IndicatorMap : ClassMap<Indicator>
{
    public IndicatorMap()
    {
        Map(m => m.Macd).Name("Macd").Optional().Default(null);
        Map(m => m.MacdSignal).Name("MacdSignal").Optional().Default(null);
        Map(m => m.MacdHistogram).Name("MacdHistogram").Optional().Default(null);
        Map(m => m.Sma200).Name("Sma200").Optional().Default(null);
        Map(m => m.Sma50).Name("Sma50").Optional().Default(null);
        Map(m => m.VolMA20).Name("VolMA20").Optional().Default(null);
        Map(m => m.Rsi14).Name("Rsi14").Optional().Default(null);
    }
}

// Read .ind file
public async Task<List<StockPriceWithIndicators>> ReadStockDataAsync(string filePath)
{
    using var reader = new StreamReader(filePath);
    using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

    csv.Context.RegisterClassMap<StockPriceMap>();
    csv.Context.RegisterClassMap<IndicatorMap>();

    var records = csv.GetRecords<StockPriceWithIndicators>().ToList();
    return records;
}

public class StockPriceWithIndicators
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public decimal AdjustedClose { get; set; }
    public long Volume { get; set; }

    // Optional indicators
    public decimal? Macd { get; set; }
    public decimal? MacdSignal { get; set; }
    public decimal? MacdHistogram { get; set; }
    public decimal? Sma200 { get; set; }
    public decimal? Sma50 { get; set; }
    public decimal? VolMA20 { get; set; }
    public decimal? Rsi14 { get; set; }
}
```

**Performance Note:**
- CsvHelper: ~0.28 GB/s
- For our use case (loading historical data once, then caching), this is more than sufficient
- If performance becomes critical, consider Sep or NReco.Csv

**Pros:**
- Easy to handle nullable indicator fields (empty strings)
- Great error messages
- Type-safe mapping
- Handles date parsing automatically

**Cons:**
- Slightly slower than specialized parsers
- More features than we strictly need

---

### High-Performance Alternative: Sep

**NuGet Package:** `Sep`

**When to Use:**
- Processing millions of rows frequently
- Performance is critical
- Multi-threaded parsing needed

**Performance:**
- ~2-4x faster than CsvHelper
- First place in 2024 benchmarks

**Trade-off:**
- Less feature-rich
- More manual type conversion
- Newer library (less battle-tested)

**Recommendation for Trading Station:**
- Start with CsvHelper (ease of development)
- Switch to Sep only if performance profiling shows CSV parsing is a bottleneck

---

## 5. Additional Recommended Packages

### Caching: Microsoft.Extensions.Caching.Memory

**Already in our stack**
```bash
dotnet add package Microsoft.Extensions.Caching.Memory
```

**Use For:**
- Cache loaded stock data
- Cache calculated indicators
- Cache backtesting results

---

### HTTP Resilience: Polly (Future - Live Data)

**NuGet Package:** `Polly` (v8.2.1)

**For Live Data Provider (Future):**
```bash
dotnet add package Polly
dotnet add package Polly.Extensions.Http
```

**Use For:**
- Retry policies for external API calls
- Circuit breaker for failing services
- Timeout handling

---

### Date/Time: NodaTime (Optional)

**NuGet Package:** `NodaTime`

**Consider If:**
- Need robust timezone handling
- Working with multiple market timezones
- Complex date calculations

**Probably Not Needed:**
- Our data is already timestamped
- .NET DateTime with timezone offset works fine

---

## Summary Recommendations

| Category | Recommended Package | Version | Priority | Rationale |
|----------|-------------------|---------|----------|-----------|
| **Technical Indicators** | Skender.Stock.Indicators | 2.7.0+ | **HIGH** | 150+ indicators, actively maintained, excellent docs |
| **Backtesting** | Custom Implementation | - | **HIGH** | Full control, temporal safety, learning |
| **Math/Statistics** | MathNet.Numerics | 5.0.0 | **MEDIUM** | Sharpe ratio, statistics, portfolio optimization |
| **CSV Parsing** | CsvHelper | 30.0.1 | **HIGH** | Easy to use, handles nullable fields, popular |
| **Caching** | Microsoft.Extensions.Caching.Memory | 8.0.0 | **HIGH** | Already in stack, standard caching |
| **HTTP Resilience** | Polly | 8.2.1 | **LOW** | Future - for live data only |
| **Options Pricing** | QLNet | 1.13.1 | **LOW** | Future enhancement only |

## Implementation Strategy

### Phase 1: Core Development (Now)
```xml
<!-- Add to TradingStation.Infrastructure -->
<PackageReference Include="Skender.Stock.Indicators" Version="2.7.0" />
<PackageReference Include="CsvHelper" Version="30.0.1" />

<!-- Add to TradingStation.Backtesting -->
<PackageReference Include="MathNet.Numerics" Version="5.0.0" />
```

### Phase 2: Optimization (If Needed)
- Profile CSV parsing performance
- Consider switching to Sep if bottleneck identified
- Evaluate custom indicator calculations vs. Skender

### Phase 3: Advanced Features (Future)
- Add Polly for live data resilience
- Consider QLNet for options/derivatives
- Evaluate portfolio optimization needs

## Cost Analysis

| Package | License | Cost | Commercial Use |
|---------|---------|------|----------------|
| Skender.Stock.Indicators | Apache 2.0 | **FREE** | ✅ Yes |
| MathNet.Numerics | MIT | **FREE** | ✅ Yes |
| CsvHelper | MS-PL / Apache 2.0 | **FREE** | ✅ Yes |
| Polly | BSD-3-Clause | **FREE** | ✅ Yes |
| QLNet | BSD | **FREE** | ✅ Yes |

**Total Cost: $0** - All recommended packages are free and open source.

## Integration Example

```xml
<!-- TradingStation.Infrastructure.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <!-- Core functionality -->
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />

    <!-- CSV parsing for .ind files -->
    <PackageReference Include="CsvHelper" Version="30.0.1" />

    <!-- Technical indicators -->
    <PackageReference Include="Skender.Stock.Indicators" Version="2.7.0" />

    <!-- Caching -->
    <PackageReference Include="Microsoft.Extensions.Caching.Memory" Version="8.0.0" />
  </ItemGroup>
</Project>

<!-- TradingStation.Backtesting.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <!-- Math and statistics for performance metrics -->
    <PackageReference Include="MathNet.Numerics" Version="5.0.0" />
  </ItemGroup>
</Project>
```

## Sources

- [Skender.Stock.Indicators on NuGet](https://www.nuget.org/packages/Skender.Stock.Indicators/)
- [Stock Indicators for .NET Documentation](https://dotnet.stockindicators.dev/)
- [GitHub - DaveSkender/Stock.Indicators](https://github.com/DaveSkender/Stock.Indicators)
- [QuantConnect LEAN GitHub](https://github.com/QuantConnect/Lean)
- [C# in Finance: A Trading Code Guide](https://www.luxalgo.com/blog/c-in-finance-a-trading-code-guide/)
- [Best Starting Kits for Algo Trading with C#](https://medium.com/hackernoon/best-starting-kits-for-algo-trading-with-c-52952e3c7522)
- [GitHub - SimpleBacktestLib](https://github.com/NotCoffee418/SimpleBacktestLib)
- [Math.NET Numerics](https://numerics.mathdotnet.com/)
- [MathNet.Numerics on NuGet](https://www.nuget.org/packages/mathnet.numerics/)
- [Using Quadratic Programming for Portfolio Optimization](https://numerics.net/blog/using-quadratic-programming-for-portfolio-optimization-2)
- [QLNet on NuGet](https://www.nuget.org/packages/QLNet/)
- [GitHub - QLNet](https://github.com/amaggiulli/QLNet)
- [Mastering QLNet: Financial Modeling Guide](https://medium.com/coinmonks/mastering-qlnet-a-detailed-guide-to-financial-modeling-with-net-3dd0f2f81d25)
- [The fastest CSV parser in .NET](https://www.joelverhagen.com/blog/2020/12/fastest-net-csv-parsers)
- [CsvHelper Documentation](https://joshclose.github.io/CsvHelper/)
- [How fast can you parse a CSV file in C#?](https://lemire.me/blog/2024/10/17/how-fast-can-you-parse-a-csv-file-in-c/)
- [GitHub - Fastest CSV parser comparison](https://github.com/mohammadeunus/Fastest-CSV-parser-in-C-sharp)
