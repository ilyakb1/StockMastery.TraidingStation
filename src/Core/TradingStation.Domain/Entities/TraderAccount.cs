namespace TradingStation.Domain.Entities;

/// <summary>
/// Represents a trading account
/// </summary>
public class TraderAccount
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal InitialCapital { get; set; }
    public decimal CurrentCash { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<Position> Positions { get; set; } = new List<Position>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();

    /// <summary>
    /// Calculates total equity (cash + open positions value)
    /// </summary>
    public decimal CalculateTotalEquity(Dictionary<string, decimal> currentPrices)
    {
        var openPositionsValue = Positions
            .Where(p => p.Status == PositionStatus.Open)
            .Sum(p => currentPrices.GetValueOrDefault(p.Symbol, p.EntryPrice) * p.Quantity);

        return CurrentCash + openPositionsValue;
    }
}
