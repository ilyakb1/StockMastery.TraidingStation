namespace TradingStation.Domain.Entities;

/// <summary>
/// Represents OHLCV price data for a stock
/// </summary>
public class StockPrice
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public decimal AdjustedClose { get; set; }
    public long Volume { get; set; }

    // Navigation properties
    public Stock Stock { get; set; } = null!;
    public Indicator? Indicator { get; set; }
}
