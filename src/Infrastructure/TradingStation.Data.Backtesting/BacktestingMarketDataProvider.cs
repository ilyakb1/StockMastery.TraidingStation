using TradingStation.Contracts;
using Microsoft.Extensions.Caching.Memory;

namespace TradingStation.Data.Backtesting;

/// <summary>
/// Provides market data with temporal constraints for backtesting.
/// CRITICAL: Enforces that no future data can be accessed.
/// </summary>
public class BacktestingMarketDataProvider : IMarketDataProvider
{
    private DateTime _simulationTime;
    private readonly IMemoryCache _cache;
    private readonly Dictionary<string, List<StockPriceData>> _stockData;

    public BacktestingMarketDataProvider(
        DateTime startTime,
        IMemoryCache cache,
        Dictionary<string, List<StockPriceData>> stockData)
    {
        _simulationTime = startTime;
        _cache = cache;
        _stockData = stockData;
    }

    /// <summary>
    /// CRITICAL: Advances simulation time. Must be called explicitly.
    /// </summary>
    public void AdvanceTime(DateTime newTime)
    {
        if (newTime < _simulationTime)
            throw new InvalidOperationException(
                $"Cannot move backward in time: current={_simulationTime:yyyy-MM-dd}, requested={newTime:yyyy-MM-dd}");

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

        var prices = await GetPricesForSymbolAsync(symbol);

        var price = prices
            .Where(p => p.Date <= asOfTime)
            .OrderByDescending(p => p.Date)
            .FirstOrDefault();

        if (price == null)
            throw new DataNotFoundException($"No data for {symbol} at or before {asOfTime:yyyy-MM-dd}");

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

        var prices = await GetPricesForSymbolAsync(symbol);

        return prices
            .Where(p => p.Date >= startTime && p.Date <= effectiveEndTime)
            .OrderBy(p => p.Date)
            .ToList();
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

    private Task<List<StockPriceData>> GetPricesForSymbolAsync(string symbol)
    {
        if (!_stockData.ContainsKey(symbol))
            throw new DataNotFoundException($"Symbol {symbol} not found in loaded data");

        // Filter to only include data up to simulation time
        var filteredPrices = _stockData[symbol]
            .Where(p => p.Date <= _simulationTime)
            .OrderBy(p => p.Date)
            .ToList();

        return Task.FromResult(filteredPrices);
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
