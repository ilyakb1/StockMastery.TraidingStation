namespace TradingStation.Domain.Entities;

/// <summary>
/// Represents a trading order
/// </summary>
public class Order
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public OrderType OrderType { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    // Navigation properties
    public TraderAccount Account { get; set; } = null!;
}

/// <summary>
/// Order type enum
/// </summary>
public enum OrderType
{
    Buy,
    Sell
}

/// <summary>
/// Order status enum
/// </summary>
public enum OrderStatus
{
    Pending,
    Executed,
    Cancelled,
    Rejected
}
