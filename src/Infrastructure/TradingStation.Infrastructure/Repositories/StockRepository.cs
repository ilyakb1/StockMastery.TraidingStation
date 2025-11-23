using TradingStation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TradingStation.Infrastructure.Data;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

namespace TradingStation.Infrastructure.Repositories;

public interface IStockRepository
{
    Task<Stock?> GetStockBySymbolAsync(string symbol);
    Task<IEnumerable<Stock>> GetAllStocksAsync();
    Task<IEnumerable<Stock>> GetStocksByMarketAsync(string market);
    Task<IEnumerable<StockPrice>> GetStockPricesAsync(string symbol, DateTime? startDate = null, DateTime? endDate = null);
    Task ImportStockDataFromCsvAsync(string symbol, string market, string csvFilePath);
    Task<Stock> CreateOrUpdateStockAsync(Stock stock);
}

public class StockRepository : IStockRepository
{
    private readonly TradingStationDbContext _context;

    public StockRepository(TradingStationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Stock?> GetStockBySymbolAsync(string symbol)
    {
        return await _context.Stocks
            .Include(s => s.Prices)
                .ThenInclude(p => p.Indicator)
            .FirstOrDefaultAsync(s => s.Symbol == symbol);
    }

    public async Task<IEnumerable<Stock>> GetAllStocksAsync()
    {
        return await _context.Stocks
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IEnumerable<Stock>> GetStocksByMarketAsync(string market)
    {
        return await _context.Stocks
            .Where(s => s.Market == market)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<IEnumerable<StockPrice>> GetStockPricesAsync(string symbol, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.StockPrices
            .Include(sp => sp.Indicator)
            .Where(sp => sp.Symbol == symbol);

        if (startDate.HasValue)
            query = query.Where(sp => sp.Date >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(sp => sp.Date <= endDate.Value);

        return await query
            .OrderBy(sp => sp.Date)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Stock> CreateOrUpdateStockAsync(Stock stock)
    {
        var existing = await _context.Stocks.FindAsync(stock.Symbol);

        if (existing == null)
        {
            _context.Stocks.Add(stock);
        }
        else
        {
            existing.Name = stock.Name;
            existing.Market = stock.Market;
            existing.Sector = stock.Sector;
            existing.LastUpdated = stock.LastUpdated;
        }

        await _context.SaveChangesAsync();
        return stock;
    }

    public async Task ImportStockDataFromCsvAsync(string symbol, string market, string csvFilePath)
    {
        if (!File.Exists(csvFilePath))
            throw new FileNotFoundException($"CSV file not found: {csvFilePath}");

        // Check if stock already exists
        var stock = await _context.Stocks
            .Include(s => s.Prices)
                .ThenInclude(p => p.Indicator)
            .FirstOrDefaultAsync(s => s.Symbol == symbol);

        if (stock == null)
        {
            stock = new Stock
            {
                Symbol = symbol,
                Market = market,
                Name = symbol,
                LastUpdated = DateTime.UtcNow
            };
            _context.Stocks.Add(stock);
        }

        // Parse CSV file with proper configuration
        using var reader = new StreamReader(csvFilePath);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            TrimOptions = TrimOptions.Trim
        });

        var records = csv.GetRecords<StockDataCsvRecord>().ToList();

        foreach (var record in records)
        {
            // Check if price record already exists
            var existingPrice = stock.Prices
                .FirstOrDefault(p => p.Date.Date == record.Date.Date);

            if (existingPrice == null)
            {
                var stockPrice = new StockPrice
                {
                    Symbol = symbol,
                    Date = record.Date,
                    Open = record.Open,
                    High = record.High,
                    Low = record.Low,
                    Close = record.Close,
                    AdjustedClose = record.AdjustedClose,
                    Volume = record.Volume,
                    Stock = stock
                };

                // Create associated indicator (1:1 relationship)
                stockPrice.Indicator = new Indicator
                {
                    StockPrice = stockPrice,
                    Macd = record.Macd,
                    MacdSignal = record.MacdSignal,
                    MacdHistogram = record.MacdHistogram,
                    Sma200 = record.Sma200,
                    Sma50 = record.Sma50,
                    VolMA20 = record.VolMA20,
                    Rsi14 = record.Rsi14
                };

                stock.Prices.Add(stockPrice);
            }
        }

        stock.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}

/// <summary>
/// CSV record mapping for .ind files
/// Format: "Date","Open","High","Low","Close","AdjustedClose","Volume","Macd","MacdSignal","MacdHistogram","Sma200","Sma50","VolMA20","Rsi14"
/// </summary>
public class StockDataCsvRecord
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public decimal AdjustedClose { get; set; }
    public long Volume { get; set; }

    // Technical indicators (nullable - may be empty in CSV)
    public decimal? Macd { get; set; }
    public decimal? MacdSignal { get; set; }
    public decimal? MacdHistogram { get; set; }
    public decimal? Sma200 { get; set; }
    public decimal? Sma50 { get; set; }
    public decimal? VolMA20 { get; set; }
    public decimal? Rsi14 { get; set; }
}
