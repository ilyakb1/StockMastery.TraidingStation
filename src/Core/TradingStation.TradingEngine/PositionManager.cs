using TradingStation.Contracts;
using Microsoft.Extensions.Logging;

namespace TradingStation.TradingEngine;

public class PositionManager : IPositionManager
{
    private readonly ILogger<PositionManager> _logger;
    private readonly List<PositionInfo> _positions = new(); // In-memory for now, will use repository

    public PositionManager(ILogger<PositionManager> logger)
    {
        _logger = logger;
    }

    public Task<PositionInfo> OpenPositionAsync(
        int accountId,
        string symbol,
        decimal entryPrice,
        int quantity,
        DateTime entryTime,
        StopLossConfig? stopLoss = null)
    {
        var position = new PositionInfo
        {
            Id = _positions.Count + 1,
            AccountId = accountId,
            Symbol = symbol,
            EntryDate = entryTime,
            EntryPrice = entryPrice,
            Quantity = quantity,
            StopLoss = stopLoss,
            Status = Contracts.PositionStatus.Open
        };

        _positions.Add(position);

        _logger.LogInformation(
            "Opened position {PositionId} for {Symbol}: {Quantity} shares @ ${Price}",
            position.Id, symbol, quantity, entryPrice);

        return Task.FromResult(position);
    }

    public Task<PositionInfo> ClosePositionAsync(
        int positionId,
        decimal exitPrice,
        DateTime exitTime,
        string reason)
    {
        var position = _positions.FirstOrDefault(p => p.Id == positionId);
        if (position == null)
            throw new InvalidOperationException($"Position {positionId} not found");

        var realizedPL = (exitPrice - position.EntryPrice) * position.Quantity;

        var closedPosition = new PositionInfo
        {
            Id = position.Id,
            AccountId = position.AccountId,
            Symbol = position.Symbol,
            EntryDate = position.EntryDate,
            EntryPrice = position.EntryPrice,
            Quantity = position.Quantity,
            StopLoss = position.StopLoss,
            Status = Contracts.PositionStatus.Closed,
            ExitDate = exitTime,
            ExitPrice = exitPrice,
            RealizedPL = realizedPL,
            ExitReason = reason
        };

        // Update in list
        var index = _positions.FindIndex(p => p.Id == positionId);
        _positions[index] = closedPosition;

        _logger.LogInformation(
            "Closed position {PositionId} for {Symbol}: P&L ${PL:N2}, Reason: {Reason}",
            positionId, position.Symbol, realizedPL, reason);

        return Task.FromResult(closedPosition);
    }

    public Task<IEnumerable<PositionInfo>> GetOpenPositionsAsync(int accountId)
    {
        var openPositions = _positions
            .Where(p => p.AccountId == accountId && p.Status == Contracts.PositionStatus.Open);

        return Task.FromResult(openPositions);
    }

    public decimal CalculateUnrealizedPL(PositionInfo position, decimal currentPrice)
    {
        if (position.Status != Contracts.PositionStatus.Open)
            return 0;

        return (currentPrice - position.EntryPrice) * position.Quantity;
    }
}
