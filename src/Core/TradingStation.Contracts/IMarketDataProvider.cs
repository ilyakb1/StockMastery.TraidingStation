namespace TradingStation.Contracts;

/// <summary>
/// Provides market data with temporal awareness.
/// CRITICAL: Implementations must respect time constraints to prevent future data leakage.
/// </summary>
public interface IMarketDataProvider
{
    /// <summary>
    /// Gets the current time in the trading environment.
    /// Backtesting: Returns simulation time
    /// Live: Returns real time
    /// </summary>
    DateTime GetCurrentTime();

    /// <summary>
    /// Gets the price data for a symbol at a specific point in time.
    /// CRITICAL: Must respect temporal constraints in backtesting.
    /// </summary>
    /// <param name="symbol">Stock symbol</param>
    /// <param name="asOfTime">Time at which to get the price. Must be &lt;= current simulation time in backtesting.</param>
    /// <returns>Market price at the specified time</returns>
    Task<MarketPrice> GetPriceAsync(string symbol, DateTime asOfTime);

    /// <summary>
    /// Gets historical prices for a date range.
    /// CRITICAL: Cannot return data after 'endTime' in backtesting.
    /// </summary>
    /// <param name="symbol">Stock symbol</param>
    /// <param name="startTime">Start of date range</param>
    /// <param name="endTime">End of date range (will be clamped to simulation time in backtesting)</param>
    /// <returns>Historical prices within the range</returns>
    Task<IEnumerable<StockPriceData>> GetHistoricalPricesAsync(
        string symbol,
        DateTime startTime,
        DateTime endTime);

    /// <summary>
    /// Checks if a symbol exists and has data at the specified time.
    /// </summary>
    Task<bool> IsSymbolAvailableAsync(string symbol, DateTime asOfTime);
}

/// <summary>
/// Represents a single market price point
/// </summary>
public class MarketPrice
{
    public string Symbol { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
    public decimal Open { get; init; }
    public decimal High { get; init; }
    public decimal Low { get; init; }
    public decimal Close { get; init; }
    public long Volume { get; init; }
}

/// <summary>
/// Represents stock price data with indicators
/// </summary>
public class StockPriceData
{
    public DateTime Date { get; init; }
    public decimal Open { get; init; }
    public decimal High { get; init; }
    public decimal Low { get; init; }
    public decimal Close { get; init; }
    public decimal AdjustedClose { get; init; }
    public long Volume { get; init; }

    // Optional technical indicators
    public decimal? Macd { get; init; }
    public decimal? MacdSignal { get; init; }
    public decimal? MacdHistogram { get; init; }
    public decimal? Sma200 { get; init; }
    public decimal? Sma50 { get; init; }
    public decimal? VolMA20 { get; init; }
    public decimal? Rsi14 { get; init; }
}
