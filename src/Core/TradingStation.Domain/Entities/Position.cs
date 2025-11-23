namespace TradingStation.Domain.Entities;

/// <summary>
/// Represents a trading position
/// </summary>
public class Position
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public decimal EntryPrice { get; set; }
    public int Quantity { get; set; }

    // Stop loss configuration
    public decimal? StopLossPrice { get; set; }
    public int? StopLossDays { get; set; }

    // Position status
    public PositionStatus Status { get; set; } = PositionStatus.Open;
    public DateTime? ExitDate { get; set; }
    public decimal? ExitPrice { get; set; }
    public decimal? RealizedPL { get; set; }
    public string? ExitReason { get; set; }

    // Navigation properties
    public TraderAccount Account { get; set; } = null!;

    /// <summary>
    /// Calculates unrealized P&L for an open position
    /// </summary>
    public decimal CalculateUnrealizedPL(decimal currentPrice)
    {
        if (Status != PositionStatus.Open)
            return 0;

        return (currentPrice - EntryPrice) * Quantity;
    }

    /// <summary>
    /// Calculates the number of days the position has been held
    /// </summary>
    public int GetDaysHeld(DateTime currentDate)
    {
        var endDate = Status == PositionStatus.Open ? currentDate : ExitDate ?? currentDate;
        return (endDate - EntryDate).Days;
    }

    /// <summary>
    /// Closes the position
    /// </summary>
    public void Close(decimal exitPrice, DateTime exitDate, string reason)
    {
        Status = PositionStatus.Closed;
        ExitPrice = exitPrice;
        ExitDate = exitDate;
        ExitReason = reason;
        RealizedPL = (exitPrice - EntryPrice) * Quantity;
    }
}

/// <summary>
/// Position status enum
/// </summary>
public enum PositionStatus
{
    Open,
    Closed
}
