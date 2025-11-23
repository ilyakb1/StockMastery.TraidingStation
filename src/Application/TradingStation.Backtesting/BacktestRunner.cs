using TradingStation.Contracts;
using TradingStation.Data.Backtesting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;

namespace TradingStation.Backtesting;

public class BacktestRunner
{
    private readonly IOrderExecutionService _executionService;
    private readonly IPositionManager _positionManager;
    private readonly IAccountManager _accountManager;
    private readonly IRiskManager _riskManager;
    private readonly ILogger<BacktestRunner> _logger;

    public BacktestRunner(
        IOrderExecutionService executionService,
        IPositionManager positionManager,
        IAccountManager accountManager,
        IRiskManager riskManager,
        ILogger<BacktestRunner> logger)
    {
        _executionService = executionService;
        _positionManager = positionManager;
        _accountManager = accountManager;
        _riskManager = riskManager;
        _logger = logger;
    }

    public async Task<BacktestResult> RunBacktestAsync(BacktestConfiguration config)
    {
        _logger.LogInformation(
            "Starting backtest from {Start} to {End} with ${Capital:N2}",
            config.StartDate, config.EndDate, config.InitialCapital);

        // Load historical data for all symbols
        var stockData = await LoadHistoricalDataAsync(config);

        // Create temporal-safe data provider
        var cache = new MemoryCache(new MemoryCacheOptions());
        var dataProvider = new BacktestingMarketDataProvider(
            config.StartDate,
            cache,
            stockData);

        // Create account
        var account = await _accountManager.GetAccountAsync(config.AccountId);

        var result = new BacktestResult
        {
            AccountId = config.AccountId,
            StartDate = config.StartDate,
            EndDate = config.EndDate,
            InitialCapital = config.InitialCapital,
            Trades = new List<TradeRecord>(),
            DailySnapshots = new List<DailySnapshot>()
        };

        // Main backtest loop - iterate day by day
        var currentDate = config.StartDate;

        while (currentDate <= config.EndDate)
        {
            try
            {
                // CRITICAL: Advance simulation time
                dataProvider.AdvanceTime(currentDate);

                // 1. Check stop losses for open positions
                await ProcessStopLossesAsync(dataProvider, currentDate, result);

                // 2. Generate trading signals using strategy
                var signals = await config.Strategy.GenerateSignalsAsync(
                    dataProvider,
                    currentDate);

                // 3. Execute signals
                foreach (var signal in signals)
                {
                    var orderRequest = new OrderRequest
                    {
                        AccountId = config.AccountId,
                        Symbol = signal.Symbol,
                        OrderType = signal.OrderType,
                        Quantity = signal.Quantity,
                        StopLoss = signal.StopLoss
                    };

                    var orderResult = await _executionService.ExecuteOrderAsync(
                        orderRequest,
                        dataProvider,
                        currentDate);

                    if (orderResult.IsSuccess)
                    {
                        result.Trades.Add(new TradeRecord
                        {
                            Date = currentDate,
                            Symbol = signal.Symbol,
                            OrderType = signal.OrderType,
                            Quantity = signal.Quantity,
                            Price = orderResult.ExecutionPrice,
                            Commission = orderResult.Commission,
                            PositionId = orderResult.PositionId ?? 0
                        });

                        _logger.LogInformation(
                            "{Date:yyyy-MM-dd}: {OrderType} {Quantity} {Symbol} @ ${Price:N2}",
                            currentDate, signal.OrderType, signal.Quantity, signal.Symbol, orderResult.ExecutionPrice);
                    }
                    else
                    {
                        _logger.LogWarning(
                            "{Date:yyyy-MM-dd}: Order failed - {Error}",
                            currentDate, orderResult.ErrorMessage);
                    }
                }

                // 4. Calculate daily snapshot
                await CalculateDailySnapshotAsync(dataProvider, currentDate, result);

                // Move to next trading day
                currentDate = currentDate.AddDays(1);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing date {Date:yyyy-MM-dd}", currentDate);
                throw;
            }
        }

        // Calculate final metrics
        CalculateFinalMetrics(result);

        _logger.LogInformation(
            "Backtest completed: Final equity ${FinalEquity:N2}, Total return {Return:P2}, Total trades {Trades}",
            result.FinalEquity, result.TotalReturn, result.Trades.Count);

        return result;
    }

    private async Task ProcessStopLossesAsync(
        BacktestingMarketDataProvider dataProvider,
        DateTime currentDate,
        BacktestResult result)
    {
        var openPositions = await _positionManager.GetOpenPositionsAsync(result.AccountId);

        foreach (var position in openPositions)
        {
            var currentPrice = await dataProvider.GetPriceAsync(position.Symbol, currentDate);

            var stopLossEval = _riskManager.EvaluateStopLoss(
                position,
                currentPrice.Close,
                currentDate);

            if (stopLossEval.ShouldTrigger)
            {
                var closeRequest = new OrderRequest
                {
                    AccountId = result.AccountId,
                    Symbol = position.Symbol,
                    OrderType = Contracts.OrderType.Sell,
                    Quantity = position.Quantity
                };

                var closeResult = await _executionService.ExecuteOrderAsync(
                    closeRequest,
                    dataProvider,
                    currentDate);

                if (closeResult.IsSuccess)
                {
                    result.Trades.Add(new TradeRecord
                    {
                        Date = currentDate,
                        Symbol = position.Symbol,
                        OrderType = Contracts.OrderType.Sell,
                        Quantity = position.Quantity,
                        Price = closeResult.ExecutionPrice,
                        Commission = closeResult.Commission,
                        PositionId = closeResult.PositionId ?? 0,
                        ExitReason = stopLossEval.Reason
                    });

                    _logger.LogInformation(
                        "{Date:yyyy-MM-dd}: Stop loss triggered - {Symbol} @ ${Price:N2}, Reason: {Reason}",
                        currentDate, position.Symbol, closeResult.ExecutionPrice, stopLossEval.Reason);
                }
            }
        }
    }

    private async Task CalculateDailySnapshotAsync(
        BacktestingMarketDataProvider dataProvider,
        DateTime currentDate,
        BacktestResult result)
    {
        var account = await _accountManager.GetAccountAsync(result.AccountId);
        var openPositions = await _positionManager.GetOpenPositionsAsync(result.AccountId);

        decimal openPositionsValue = 0;

        foreach (var position in openPositions)
        {
            var currentPrice = await dataProvider.GetPriceAsync(position.Symbol, currentDate);
            openPositionsValue += currentPrice.Close * position.Quantity;
        }

        var totalEquity = account.CurrentCash + openPositionsValue;

        result.DailySnapshots.Add(new DailySnapshot
        {
            Date = currentDate,
            Cash = account.CurrentCash,
            PositionsValue = openPositionsValue,
            TotalEquity = totalEquity,
            OpenPositions = openPositions.Count()
        });
    }

    private async Task<Dictionary<string, List<StockPriceData>>> LoadHistoricalDataAsync(
        BacktestConfiguration config)
    {
        // This will be implemented to load from database
        // For now, return empty dictionary
        _logger.LogInformation("Loading historical data for backtest");

        var data = new Dictionary<string, List<StockPriceData>>();

        // TODO: Load from database using StockRepository
        // var stocks = await _stockRepository.GetAllStocksAsync();
        // foreach (var stock in stocks)
        // {
        //     data[stock.Symbol] = stock.Prices.Select(p => new StockPriceData { ... }).ToList();
        // }

        return data;
    }

    private void CalculateFinalMetrics(BacktestResult result)
    {
        if (result.DailySnapshots.Count == 0)
            return;

        result.FinalEquity = result.DailySnapshots.Last().TotalEquity;
        result.TotalReturn = (result.FinalEquity - result.InitialCapital) / result.InitialCapital;

        // Calculate max drawdown
        decimal peak = result.InitialCapital;
        decimal maxDrawdown = 0;

        foreach (var snapshot in result.DailySnapshots)
        {
            if (snapshot.TotalEquity > peak)
                peak = snapshot.TotalEquity;

            var drawdown = (peak - snapshot.TotalEquity) / peak;
            if (drawdown > maxDrawdown)
                maxDrawdown = drawdown;
        }

        result.MaxDrawdown = maxDrawdown;

        // Calculate win rate
        var closedTrades = result.Trades
            .GroupBy(t => new { t.Symbol, t.PositionId })
            .Select(g => new
            {
                Entry = g.FirstOrDefault(t => t.OrderType == Contracts.OrderType.Buy),
                Exit = g.FirstOrDefault(t => t.OrderType == Contracts.OrderType.Sell)
            })
            .Where(t => t.Entry != null && t.Exit != null)
            .ToList();

        var winningTrades = closedTrades.Count(t =>
            t.Exit!.Price > t.Entry!.Price);

        result.WinRate = closedTrades.Count > 0
            ? (decimal)winningTrades / closedTrades.Count
            : 0;

        result.TotalTrades = closedTrades.Count;

        // Calculate Sharpe ratio (simplified - assumes daily returns)
        if (result.DailySnapshots.Count > 1)
        {
            var dailyReturns = new List<decimal>();
            for (int i = 1; i < result.DailySnapshots.Count; i++)
            {
                var prevEquity = result.DailySnapshots[i - 1].TotalEquity;
                var currEquity = result.DailySnapshots[i].TotalEquity;
                var dailyReturn = (currEquity - prevEquity) / prevEquity;
                dailyReturns.Add(dailyReturn);
            }

            var avgReturn = dailyReturns.Average();
            var stdDev = (decimal)Math.Sqrt((double)dailyReturns.Sum(r => (r - avgReturn) * (r - avgReturn)) / dailyReturns.Count);

            result.SharpeRatio = stdDev != 0 ? (avgReturn / stdDev) * (decimal)Math.Sqrt(252) : 0; // Annualized
        }
    }
}

public class BacktestConfiguration
{
    public int AccountId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal InitialCapital { get; set; }
    public ITradingStrategy Strategy { get; set; } = null!;
}

public class BacktestResult
{
    public int AccountId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal InitialCapital { get; set; }
    public decimal FinalEquity { get; set; }
    public decimal TotalReturn { get; set; }
    public decimal MaxDrawdown { get; set; }
    public decimal SharpeRatio { get; set; }
    public decimal WinRate { get; set; }
    public int TotalTrades { get; set; }
    public List<TradeRecord> Trades { get; set; } = new();
    public List<DailySnapshot> DailySnapshots { get; set; } = new();
}

public class TradeRecord
{
    public DateTime Date { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public Contracts.OrderType OrderType { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Commission { get; set; }
    public int PositionId { get; set; }
    public string? ExitReason { get; set; }
}

public class DailySnapshot
{
    public DateTime Date { get; set; }
    public decimal Cash { get; set; }
    public decimal PositionsValue { get; set; }
    public decimal TotalEquity { get; set; }
    public int OpenPositions { get; set; }
}
