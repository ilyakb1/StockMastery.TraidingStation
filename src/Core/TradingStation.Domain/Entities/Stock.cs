namespace TradingStation.Domain.Entities;

/// <summary>
/// Represents a stock/security
/// </summary>
public class Stock
{
    public string Symbol { get; set; } = string.Empty;
    public string Market { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Sector { get; set; }
    public DateTime LastUpdated { get; set; }

    // Navigation properties
    public ICollection<StockPrice> Prices { get; set; } = new List<StockPrice>();
}
