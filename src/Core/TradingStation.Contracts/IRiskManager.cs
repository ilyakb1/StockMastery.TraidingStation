namespace TradingStation.Contracts;

/// <summary>
/// Manages risk and validates trading decisions
/// </summary>
public interface IRiskManager
{
    /// <summary>
    /// Validates if an order meets risk requirements
    /// </summary>
    Task<RiskValidationResult> ValidateOrderAsync(OrderRequest order, AccountInfo account);

    /// <summary>
    /// Evaluates if a stop loss should be triggered
    /// </summary>
    StopLossEvaluationResult EvaluateStopLoss(
        PositionInfo position,
        decimal currentPrice,
        DateTime currentTime);

    /// <summary>
    /// Calculates position size based on risk parameters
    /// </summary>
    int CalculatePositionSize(decimal accountBalance, decimal riskPercent, decimal entryPrice, decimal stopLossPrice);
}

/// <summary>
/// Result of risk validation
/// </summary>
public class RiskValidationResult
{
    public bool IsValid { get; init; }
    public string? ErrorMessage { get; init; }
}

/// <summary>
/// Result of stop loss evaluation
/// </summary>
public class StopLossEvaluationResult
{
    public bool ShouldTrigger { get; init; }
    public string Reason { get; init; } = string.Empty;
    public decimal? TriggerPrice { get; init; }
}

/// <summary>
/// Account information for risk calculations
/// </summary>
public class AccountInfo
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public decimal CurrentCash { get; init; }
    public decimal InitialCapital { get; init; }
    public bool IsActive { get; init; }
}
