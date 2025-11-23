using Microsoft.AspNetCore.Mvc;
using TradingStation.Infrastructure.Repositories;
using TradingStation.Domain.Entities;

namespace TradingStation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StocksController : ControllerBase
{
    private readonly IStockRepository _stockRepository;
    private readonly ILogger<StocksController> _logger;
    private readonly IConfiguration _configuration;

    public StocksController(
        IStockRepository stockRepository,
        ILogger<StocksController> logger,
        IConfiguration configuration)
    {
        _stockRepository = stockRepository;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Get all stocks
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<StockDto>>> GetAllStocks()
    {
        var stocks = await _stockRepository.GetAllStocksAsync();
        return Ok(stocks.Select(s => new StockDto
        {
            Symbol = s.Symbol,
            Name = s.Name,
            Market = s.Market,
            Sector = s.Sector,
            LastUpdated = s.LastUpdated
        }));
    }

    /// <summary>
    /// Get stocks by market
    /// </summary>
    [HttpGet("market/{market}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<StockDto>>> GetStocksByMarket(string market)
    {
        var stocks = await _stockRepository.GetStocksByMarketAsync(market);
        return Ok(stocks.Select(s => new StockDto
        {
            Symbol = s.Symbol,
            Name = s.Name,
            Market = s.Market,
            Sector = s.Sector,
            LastUpdated = s.LastUpdated
        }));
    }

    /// <summary>
    /// Get stock by symbol with prices
    /// </summary>
    [HttpGet("{symbol}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StockDetailDto>> GetStock(string symbol)
    {
        var stock = await _stockRepository.GetStockBySymbolAsync(symbol);

        if (stock == null)
            return NotFound($"Stock {symbol} not found");

        return Ok(new StockDetailDto
        {
            Symbol = stock.Symbol,
            Name = stock.Name,
            Market = stock.Market,
            Sector = stock.Sector,
            LastUpdated = stock.LastUpdated,
            PriceCount = stock.Prices.Count,
            FirstDate = stock.Prices.MinBy(p => p.Date)?.Date,
            LastDate = stock.Prices.MaxBy(p => p.Date)?.Date
        });
    }

    /// <summary>
    /// Get stock prices with optional date range
    /// </summary>
    [HttpGet("{symbol}/prices")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<StockPriceDto>>> GetStockPrices(
        string symbol,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var prices = await _stockRepository.GetStockPricesAsync(symbol, startDate, endDate);

        if (!prices.Any())
            return NotFound($"No price data found for {symbol}");

        return Ok(prices.Select(p => new StockPriceDto
        {
            Date = p.Date,
            Open = p.Open,
            High = p.High,
            Low = p.Low,
            Close = p.Close,
            AdjustedClose = p.AdjustedClose,
            Volume = p.Volume,
            Indicators = p.Indicator != null ? new IndicatorDto
            {
                Macd = p.Indicator.Macd,
                MacdSignal = p.Indicator.MacdSignal,
                MacdHistogram = p.Indicator.MacdHistogram,
                Sma200 = p.Indicator.Sma200,
                Sma50 = p.Indicator.Sma50,
                VolMA20 = p.Indicator.VolMA20,
                Rsi14 = p.Indicator.Rsi14
            } : null
        }));
    }

    /// <summary>
    /// Import stock data from CSV file
    /// </summary>
    [HttpPost("{symbol}/import")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ImportStockData(
        string symbol,
        [FromQuery] string market,
        [FromQuery] string fileName)
    {
        try
        {
            var dataDirectory = _configuration["StockDataDirectory"] ?? @"C:\repos\StockMastery\Data";
            var filePath = Path.Combine(dataDirectory, fileName);

            if (!System.IO.File.Exists(filePath))
                return BadRequest($"File not found: {filePath}");

            _logger.LogInformation("Importing data for {Symbol} from {FilePath}", symbol, filePath);

            await _stockRepository.ImportStockDataFromCsvAsync(symbol, market, filePath);

            var stock = await _stockRepository.GetStockBySymbolAsync(symbol);

            return Ok(new
            {
                Symbol = symbol,
                Market = market,
                PricesImported = stock?.Prices.Count ?? 0,
                Message = $"Successfully imported data for {symbol}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing data for {Symbol}", symbol);
            return BadRequest(new { Error = ex.Message });
        }
    }
}

// DTOs
public class StockDto
{
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Market { get; set; } = string.Empty;
    public string? Sector { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class StockDetailDto : StockDto
{
    public int PriceCount { get; set; }
    public DateTime? FirstDate { get; set; }
    public DateTime? LastDate { get; set; }
}

public class StockPriceDto
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public decimal AdjustedClose { get; set; }
    public long Volume { get; set; }
    public IndicatorDto? Indicators { get; set; }
}

public class IndicatorDto
{
    public decimal? Macd { get; set; }
    public decimal? MacdSignal { get; set; }
    public decimal? MacdHistogram { get; set; }
    public decimal? Sma200 { get; set; }
    public decimal? Sma50 { get; set; }
    public decimal? VolMA20 { get; set; }
    public decimal? Rsi14 { get; set; }
}
