namespace TradingStation.Domain.Entities;

/// <summary>
/// Represents technical indicators for a price point
/// </summary>
public class Indicator
{
    public int Id { get; set; }
    public int StockPriceId { get; set; }

    // Technical indicators
    public decimal? Macd { get; set; }
    public decimal? MacdSignal { get; set; }
    public decimal? MacdHistogram { get; set; }
    public decimal? Sma200 { get; set; }
    public decimal? Sma50 { get; set; }
    public decimal? VolMA20 { get; set; }
    public decimal? Rsi14 { get; set; }

    // Navigation properties
    public StockPrice StockPrice { get; set; } = null!;
}
