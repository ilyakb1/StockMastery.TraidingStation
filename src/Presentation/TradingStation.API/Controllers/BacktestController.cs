using Microsoft.AspNetCore.Mvc;
using TradingStation.Backtesting;
using TradingStation.Backtesting.Strategies;
using TradingStation.Contracts;
using TradingStation.Infrastructure.Repositories;
using Microsoft.Extensions.Caching.Memory;
using TradingStation.Data.Backtesting;

namespace TradingStation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BacktestController : ControllerBase
{
    private readonly BacktestRunner _backtestRunner;
    private readonly IStockRepository _stockRepository;
    private readonly ITraderAccountRepository _accountRepository;
    private readonly ILogger<BacktestController> _logger;
    private readonly IMemoryCache _cache;

    public BacktestController(
        BacktestRunner backtestRunner,
        IStockRepository stockRepository,
        ITraderAccountRepository accountRepository,
        ILogger<BacktestController> logger,
        IMemoryCache cache)
    {
        _backtestRunner = backtestRunner;
        _stockRepository = stockRepository;
        _accountRepository = accountRepository;
        _logger = logger;
        _cache = cache;
    }

    /// <summary>
    /// Run a backtest with Moving Average Crossover strategy
    /// </summary>
    [HttpPost("run")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BacktestResultDto>> RunBacktest([FromBody] BacktestRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Starting backtest for account {AccountId} from {Start} to {End}",
                request.AccountId, request.StartDate, request.EndDate);

            // Validate account exists
            var account = await _accountRepository.GetByIdAsync(request.AccountId);
            if (account == null)
                return BadRequest($"Account {request.AccountId} not found");

            // Load historical data for symbols
            var stockData = await LoadHistoricalDataAsync(request.Symbols, request.StartDate, request.EndDate);

            if (stockData.Count == 0)
                return BadRequest("No stock data available for the specified symbols and date range");

            // Create strategy based on request
            ITradingStrategy strategy = request.StrategyType.ToLower() switch
            {
                "ma_crossover" => new MovingAverageCrossoverStrategy(
                    request.Symbols,
                    request.ShortPeriod ?? 20,
                    request.LongPeriod ?? 50,
                    request.PositionSize ?? 100,
                    request.StopLoss != null ? new StopLossConfig
                    {
                        Type = request.StopLoss.PriceThreshold.HasValue ? StopLossType.Price : StopLossType.Days,
                        PriceThreshold = request.StopLoss.PriceThreshold,
                        DaysToHold = request.StopLoss.DaysToHold
                    } : null),
                _ => throw new ArgumentException($"Unknown strategy type: {request.StrategyType}")
            };

            // Create backtest configuration
            var config = new BacktestConfiguration
            {
                AccountId = request.AccountId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                InitialCapital = account.InitialCapital,
                Strategy = strategy,
                StockData = stockData
            };

            // Run backtest
            var result = await _backtestRunner.RunBacktestAsync(config);

            return Ok(MapToDto(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running backtest");
            return BadRequest(new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Get available symbols for backtesting
    /// </summary>
    [HttpGet("symbols")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetAvailableSymbols()
    {
        var stocks = await _stockRepository.GetAllStocksAsync();
        return Ok(stocks.Select(s => s.Symbol).OrderBy(s => s));
    }

    private async Task<Dictionary<string, List<StockPriceData>>> LoadHistoricalDataAsync(
        List<string> symbols,
        DateTime startDate,
        DateTime endDate)
    {
        var stockData = new Dictionary<string, List<StockPriceData>>();

        foreach (var symbol in symbols)
        {
            var prices = await _stockRepository.GetStockPricesAsync(
                symbol,
                startDate.AddDays(-100), // Extra buffer for indicator calculation
                endDate);

            if (prices.Any())
            {
                stockData[symbol] = prices.Select(p => new StockPriceData
                {
                    Date = p.Date,
                    Open = p.Open,
                    High = p.High,
                    Low = p.Low,
                    Close = p.Close,
                    Volume = p.Volume
                }).ToList();
            }
        }

        return stockData;
    }

    private BacktestResultDto MapToDto(BacktestResult result)
    {
        // Group trades by position to create paired entry/exit trades
        var pairedTrades = new List<PairedTradeDto>();
        var tradesByPosition = result.Trades
            .GroupBy(t => t.PositionId)
            .Where(g => g.Key > 0);

        foreach (var positionGroup in tradesByPosition)
        {
            var buyTrade = positionGroup.FirstOrDefault(t => t.OrderType == Contracts.OrderType.Buy);
            var sellTrade = positionGroup.FirstOrDefault(t => t.OrderType == Contracts.OrderType.Sell);

            if (buyTrade != null)
            {
                var entryPrice = buyTrade.Price;
                var exitPrice = sellTrade?.Price ?? 0;
                var quantity = buyTrade.Quantity;

                var profitLoss = sellTrade != null
                    ? (exitPrice - entryPrice) * quantity - buyTrade.Commission - (sellTrade.Commission)
                    : 0;

                var returnPercent = entryPrice > 0 && sellTrade != null
                    ? ((exitPrice - entryPrice) / entryPrice) * 100
                    : 0;

                pairedTrades.Add(new PairedTradeDto
                {
                    Symbol = buyTrade.Symbol,
                    EntryDate = buyTrade.Date,
                    EntryPrice = entryPrice,
                    ExitDate = sellTrade?.Date,
                    ExitPrice = sellTrade != null ? exitPrice : (decimal?)null,
                    Quantity = quantity,
                    ProfitLoss = profitLoss,
                    ReturnPercent = returnPercent,
                    ExitReason = sellTrade?.ExitReason
                });
            }
        }

        return new BacktestResultDto
        {
            AccountId = result.AccountId,
            StartDate = result.StartDate,
            EndDate = result.EndDate,
            InitialCapital = result.InitialCapital,
            FinalEquity = result.FinalEquity,
            TotalReturn = result.TotalReturn,
            TotalReturnPercent = result.TotalReturn * 100,
            MaxDrawdown = result.MaxDrawdown,
            MaxDrawdownPercent = result.MaxDrawdown * 100,
            SharpeRatio = result.SharpeRatio,
            WinRate = result.WinRate,
            WinRatePercent = result.WinRate * 100,
            TotalTrades = result.TotalTrades,
            Trades = pairedTrades,
            DailySnapshots = result.DailySnapshots.Select(s => new DailySnapshotDto
            {
                Date = s.Date,
                Cash = s.Cash,
                PositionsValue = s.PositionsValue,
                TotalEquity = s.TotalEquity,
                OpenPositions = s.OpenPositions
            }).ToList()
        };
    }
}

// DTOs
public class BacktestRequest
{
    public int AccountId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<string> Symbols { get; set; } = new();
    public string StrategyType { get; set; } = "ma_crossover";
    public int? ShortPeriod { get; set; }
    public int? LongPeriod { get; set; }
    public int? PositionSize { get; set; }
    public StopLossRequest? StopLoss { get; set; }
}

public class StopLossRequest
{
    public decimal? PriceThreshold { get; set; }
    public int? DaysToHold { get; set; }
}

public class BacktestResultDto
{
    public int AccountId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal InitialCapital { get; set; }
    public decimal FinalEquity { get; set; }
    public decimal TotalReturn { get; set; }
    public decimal TotalReturnPercent { get; set; }
    public decimal MaxDrawdown { get; set; }
    public decimal MaxDrawdownPercent { get; set; }
    public decimal SharpeRatio { get; set; }
    public decimal WinRate { get; set; }
    public decimal WinRatePercent { get; set; }
    public int TotalTrades { get; set; }
    public List<PairedTradeDto> Trades { get; set; } = new();
    public List<DailySnapshotDto> DailySnapshots { get; set; } = new();
}

public class PairedTradeDto
{
    public string Symbol { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public decimal EntryPrice { get; set; }
    public DateTime? ExitDate { get; set; }
    public decimal? ExitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal ProfitLoss { get; set; }
    public decimal ReturnPercent { get; set; }
    public string? ExitReason { get; set; }
}

public class DailySnapshotDto
{
    public DateTime Date { get; set; }
    public decimal Cash { get; set; }
    public decimal PositionsValue { get; set; }
    public decimal TotalEquity { get; set; }
    public int OpenPositions { get; set; }
}
