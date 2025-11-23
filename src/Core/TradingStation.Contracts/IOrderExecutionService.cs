namespace TradingStation.Contracts;

/// <summary>
/// Executes trading orders
/// </summary>
public interface IOrderExecutionService
{
    /// <summary>
    /// Executes an order using the provided market data provider
    /// </summary>
    Task<OrderResult> ExecuteOrderAsync(
        OrderRequest order,
        IMarketDataProvider dataProvider,
        DateTime currentTime);
}

/// <summary>
/// Request to execute an order
/// </summary>
public class OrderRequest
{
    public int AccountId { get; init; }
    public string Symbol { get; init; } = string.Empty;
    public OrderType OrderType { get; init; }
    public int Quantity { get; init; }
    public decimal? LimitPrice { get; init; } // For limit orders (future)
    public StopLossConfig? StopLoss { get; init; }
}

/// <summary>
/// Result of order execution
/// </summary>
public class OrderResult
{
    public bool IsSuccess { get; init; }
    public string? ErrorMessage { get; init; }
    public int? OrderId { get; init; }
    public int? PositionId { get; init; }
    public decimal ExecutionPrice { get; init; }
    public decimal Commission { get; init; }
    public DateTime ExecutionTime { get; init; }
}

/// <summary>
/// Order type
/// </summary>
public enum OrderType
{
    Buy,
    Sell,
    SellShort, // Future
    CoverShort // Future
}

/// <summary>
/// Stop loss configuration
/// </summary>
public class StopLossConfig
{
    public StopLossType Type { get; init; }
    public decimal? PriceThreshold { get; init; } // For price-based
    public int? DaysToHold { get; init; } // For time-based
    public decimal? TrailingPercent { get; init; } // For trailing stop (future)
}

/// <summary>
/// Type of stop loss
/// </summary>
public enum StopLossType
{
    None,
    Price,      // Exit when price drops below threshold
    Days,       // Exit after N days
    Trailing    // Trailing stop loss (future)
}
