using TradingStation.Contracts;
using Microsoft.Extensions.Logging;

namespace TradingStation.TradingEngine;

public class OrderExecutionEngine : IOrderExecutionService
{
    private readonly IPositionManager _positionManager;
    private readonly IAccountManager _accountManager;
    private readonly IRiskManager _riskManager;
    private readonly ILogger<OrderExecutionEngine> _logger;

    public OrderExecutionEngine(
        IPositionManager positionManager,
        IAccountManager accountManager,
        IRiskManager riskManager,
        ILogger<OrderExecutionEngine> logger)
    {
        _positionManager = positionManager;
        _accountManager = accountManager;
        _riskManager = riskManager;
        _logger = logger;
    }

    public async Task<OrderResult> ExecuteOrderAsync(
        OrderRequest order,
        IMarketDataProvider dataProvider,
        DateTime currentTime)
    {
        try
        {
            _logger.LogInformation(
                "Executing {OrderType} order for {Symbol}: {Quantity} shares",
                order.OrderType, order.Symbol, order.Quantity);

            // 1. Get account
            var account = await _accountManager.GetAccountAsync(order.AccountId);

            // 2. Validate order
            var validation = await _riskManager.ValidateOrderAsync(order, account);
            if (!validation.IsValid)
            {
                _logger.LogWarning("Order validation failed: {Error}", validation.ErrorMessage);
                return new OrderResult
                {
                    IsSuccess = false,
                    ErrorMessage = validation.ErrorMessage,
                    ExecutionTime = currentTime
                };
            }

            // 3. Get current price (respects temporal constraints)
            var priceData = await dataProvider.GetPriceAsync(order.Symbol, currentTime);
            var executionPrice = priceData.Close;

            // 4. Calculate costs
            var commission = CalculateCommission(order.Quantity, executionPrice);

            // 5. Execute based on order type
            if (order.OrderType == OrderType.Buy)
            {
                return await ExecuteBuyOrderAsync(
                    order,
                    account,
                    executionPrice,
                    commission,
                    currentTime);
            }
            else // Sell
            {
                return await ExecuteSellOrderAsync(
                    order,
                    account,
                    executionPrice,
                    commission,
                    currentTime);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing order for {Symbol}", order.Symbol);
            return new OrderResult
            {
                IsSuccess = false,
                ErrorMessage = ex.Message,
                ExecutionTime = currentTime
            };
        }
    }

    private async Task<OrderResult> ExecuteBuyOrderAsync(
        OrderRequest order,
        AccountInfo account,
        decimal executionPrice,
        decimal commission,
        DateTime currentTime)
    {
        var totalCost = executionPrice * order.Quantity + commission;

        // Reserve funds
        if (!await _accountManager.ReserveFundsAsync(account.Id, totalCost))
        {
            return new OrderResult
            {
                IsSuccess = false,
                ErrorMessage = "Insufficient funds",
                ExecutionTime = currentTime
            };
        }

        // Open position
        var position = await _positionManager.OpenPositionAsync(
            account.Id,
            order.Symbol,
            executionPrice,
            order.Quantity,
            currentTime,
            order.StopLoss);

        _logger.LogInformation(
            "Buy order executed: {Symbol} {Quantity} @ ${Price:N2}, Commission: ${Commission:N2}",
            order.Symbol, order.Quantity, executionPrice, commission);

        return new OrderResult
        {
            IsSuccess = true,
            PositionId = position.Id,
            ExecutionPrice = executionPrice,
            Commission = commission,
            ExecutionTime = currentTime
        };
    }

    private async Task<OrderResult> ExecuteSellOrderAsync(
        OrderRequest order,
        AccountInfo account,
        decimal executionPrice,
        decimal commission,
        DateTime currentTime)
    {
        // Find open position for this symbol
        var openPositions = await _positionManager.GetOpenPositionsAsync(account.Id);
        var position = openPositions.FirstOrDefault(p => p.Symbol == order.Symbol);

        if (position == null)
        {
            return new OrderResult
            {
                IsSuccess = false,
                ErrorMessage = $"No open position for {order.Symbol}",
                ExecutionTime = currentTime
            };
        }

        if (position.Quantity < order.Quantity)
        {
            return new OrderResult
            {
                IsSuccess = false,
                ErrorMessage = $"Insufficient shares. Have {position.Quantity}, requested {order.Quantity}",
                ExecutionTime = currentTime
            };
        }

        // Close position
        var closedPosition = await _positionManager.ClosePositionAsync(
            position.Id,
            executionPrice,
            currentTime,
            "User requested");

        // Calculate proceeds and update account
        var proceeds = executionPrice * order.Quantity;
        var netPL = closedPosition.RealizedPL!.Value - commission;

        await _accountManager.UpdateBalanceAsync(account.Id, proceeds);

        _logger.LogInformation(
            "Sell order executed: {Symbol} {Quantity} @ ${Price:N2}, P&L: ${PL:N2}, Commission: ${Commission:N2}",
            order.Symbol, order.Quantity, executionPrice, closedPosition.RealizedPL, commission);

        return new OrderResult
        {
            IsSuccess = true,
            PositionId = closedPosition.Id,
            ExecutionPrice = executionPrice,
            Commission = commission,
            ExecutionTime = currentTime
        };
    }

    private decimal CalculateCommission(int quantity, decimal price)
    {
        // Simple flat commission model
        return 5.00m;
    }
}
