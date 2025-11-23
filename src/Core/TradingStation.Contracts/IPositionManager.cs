namespace TradingStation.Contracts;

/// <summary>
/// Manages trading positions
/// </summary>
public interface IPositionManager
{
    /// <summary>
    /// Opens a new position
    /// </summary>
    Task<PositionInfo> OpenPositionAsync(
        int accountId,
        string symbol,
        decimal entryPrice,
        int quantity,
        DateTime entryTime,
        StopLossConfig? stopLoss = null);

    /// <summary>
    /// Closes an existing position
    /// </summary>
    Task<PositionInfo> ClosePositionAsync(
        int positionId,
        decimal exitPrice,
        DateTime exitTime,
        string reason);

    /// <summary>
    /// Gets all open positions for an account
    /// </summary>
    Task<IEnumerable<PositionInfo>> GetOpenPositionsAsync(int accountId);

    /// <summary>
    /// Calculates unrealized P&L for a position
    /// </summary>
    decimal CalculateUnrealizedPL(PositionInfo position, decimal currentPrice);
}

/// <summary>
/// Information about a trading position
/// </summary>
public class PositionInfo
{
    public int Id { get; init; }
    public int AccountId { get; init; }
    public string Symbol { get; init; } = string.Empty;
    public DateTime EntryDate { get; init; }
    public decimal EntryPrice { get; init; }
    public int Quantity { get; init; }
    public StopLossConfig? StopLoss { get; init; }
    public PositionStatus Status { get; init; }
    public DateTime? ExitDate { get; init; }
    public decimal? ExitPrice { get; init; }
    public decimal? RealizedPL { get; init; }
    public string? ExitReason { get; init; }
}

/// <summary>
/// Position status
/// </summary>
public enum PositionStatus
{
    Open,
    Closed
}
