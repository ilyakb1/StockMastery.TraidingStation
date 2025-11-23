using TradingStation.Contracts;
using Microsoft.Extensions.Logging;

namespace TradingStation.TradingEngine;

public class RiskManager : IRiskManager
{
    private readonly ILogger<RiskManager> _logger;
    private const decimal MaxPositionSizePercent = 0.25m; // Max 25% of account in one position
    private const int MaxOpenPositions = 10;

    public RiskManager(ILogger<RiskManager> logger)
    {
        _logger = logger;
    }

    public Task<RiskValidationResult> ValidateOrderAsync(OrderRequest order, AccountInfo account)
    {
        // Check if account is active
        if (!account.IsActive)
        {
            return Task.FromResult(new RiskValidationResult
            {
                IsValid = false,
                ErrorMessage = "Account is not active"
            });
        }

        // Calculate order value
        var estimatedPrice = 100m; // Would get from market data in real implementation
        var orderValue = estimatedPrice * order.Quantity;

        // Check if order exceeds max position size
        var maxPositionValue = account.InitialCapital * MaxPositionSizePercent;
        if (orderValue > maxPositionValue)
        {
            return Task.FromResult(new RiskValidationResult
            {
                IsValid = false,
                ErrorMessage = $"Order value ${orderValue:N2} exceeds maximum position size ${maxPositionValue:N2}"
            });
        }

        // Check sufficient funds for buy orders
        if (order.OrderType == OrderType.Buy)
        {
            var commission = 5m; // Estimated commission
            var totalRequired = orderValue + commission;

            if (totalRequired > account.CurrentCash)
            {
                return Task.FromResult(new RiskValidationResult
                {
                    IsValid = false,
                    ErrorMessage = $"Insufficient funds. Required: ${totalRequired:N2}, Available: ${account.CurrentCash:N2}"
                });
            }
        }

        return Task.FromResult(new RiskValidationResult
        {
            IsValid = true
        });
    }

    public StopLossEvaluationResult EvaluateStopLoss(
        PositionInfo position,
        decimal currentPrice,
        DateTime currentTime)
    {
        if (position.StopLoss == null)
        {
            return new StopLossEvaluationResult
            {
                ShouldTrigger = false,
                Reason = "No stop loss configured"
            };
        }

        switch (position.StopLoss.Type)
        {
            case StopLossType.Price:
                if (position.StopLoss.PriceThreshold.HasValue &&
                    currentPrice <= position.StopLoss.PriceThreshold.Value)
                {
                    return new StopLossEvaluationResult
                    {
                        ShouldTrigger = true,
                        Reason = $"Price stop loss triggered: ${currentPrice:N2} <= ${position.StopLoss.PriceThreshold.Value:N2}",
                        TriggerPrice = currentPrice
                    };
                }
                break;

            case StopLossType.Days:
                if (position.StopLoss.DaysToHold.HasValue)
                {
                    var daysHeld = (currentTime - position.EntryDate).Days;
                    if (daysHeld >= position.StopLoss.DaysToHold.Value)
                    {
                        return new StopLossEvaluationResult
                        {
                            ShouldTrigger = true,
                            Reason = $"Time-based stop loss triggered: held for {daysHeld} days",
                            TriggerPrice = currentPrice
                        };
                    }
                }
                break;

            case StopLossType.Trailing:
                // Trailing stop loss logic (future enhancement)
                break;
        }

        return new StopLossEvaluationResult
        {
            ShouldTrigger = false,
            Reason = "Stop loss conditions not met"
        };
    }

    public int CalculatePositionSize(
        decimal accountBalance,
        decimal riskPercent,
        decimal entryPrice,
        decimal stopLossPrice)
    {
        if (stopLossPrice >= entryPrice)
            throw new ArgumentException("Stop loss price must be below entry price");

        var riskAmount = accountBalance * riskPercent;
        var riskPerShare = entryPrice - stopLossPrice;

        var shares = (int)(riskAmount / riskPerShare);

        _logger.LogDebug(
            "Calculated position size: {Shares} shares (Risk: ${Risk:N2}, Risk/share: ${RiskPerShare:N2})",
            shares, riskAmount, riskPerShare);

        return shares;
    }
}
