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
    Task ImportStockDataFromCsvAsync(string symbol, string csvFilePath);
}

public class StockRepository : IStockRepository
{
    private readonly TradingStationDbContext _context;

    public StockRepository(TradingStationDbContext context)
    {
        _context = context;
    }

    public async Task<Stock?> GetStockBySymbolAsync(string symbol)
    {
        return await _context.Stocks
            .Include(s => s.Prices)
            .Include(s => s.Indicators)
            .FirstOrDefaultAsync(s => s.Symbol == symbol);
    }

    public async Task<IEnumerable<Stock>> GetAllStocksAsync()
    {
        return await _context.Stocks
            .Include(s => s.Prices)
            .Include(s => s.Indicators)
            .ToListAsync();
    }

    public async Task ImportStockDataFromCsvAsync(string symbol, string csvFilePath)
    {
        if (!File.Exists(csvFilePath))
            throw new FileNotFoundException($"CSV file not found: {csvFilePath}");

        // Check if stock already exists
        var stock = await _context.Stocks
            .Include(s => s.Prices)
            .Include(s => s.Indicators)
            .FirstOrDefaultAsync(s => s.Symbol == symbol);

        if (stock == null)
        {
            stock = new Stock
            {
                Symbol = symbol,
                Name = symbol, // Will be updated from data if available
                Prices = new List<StockPrice>(),
                Indicators = new List<Indicator>()
            };
            _context.Stocks.Add(stock);
        }

        // Parse CSV file
        using var reader = new StreamReader(csvFilePath);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null
        });

        var records = csv.GetRecords<StockDataCsvRecord>().ToList();

        foreach (var record in records)
        {
            // Check if price record already exists
            var existingPrice = stock.Prices
                .FirstOrDefault(p => p.Date == record.Date);

            if (existingPrice == null)
            {
                var price = new StockPrice
                {
                    Date = record.Date,
                    Open = record.Open,
                    High = record.High,
                    Low = record.Low,
                    Close = record.Close,
                    Volume = record.Volume,
                    Stock = stock
                };
                stock.Prices.Add(price);

                // Add indicators for this date
                if (record.MA20.HasValue)
                {
                    stock.Indicators.Add(new Indicator
                    {
                        Date = record.Date,
                        Name = "MA20",
                        Value = record.MA20.Value,
                        Stock = stock
                    });
                }

                if (record.MA50.HasValue)
                {
                    stock.Indicators.Add(new Indicator
                    {
                        Date = record.Date,
                        Name = "MA50",
                        Value = record.MA50.Value,
                        Stock = stock
                    });
                }

                if (record.RSI.HasValue)
                {
                    stock.Indicators.Add(new Indicator
                    {
                        Date = record.Date,
                        Name = "RSI",
                        Value = record.RSI.Value,
                        Stock = stock
                    });
                }

                if (record.MACD.HasValue)
                {
                    stock.Indicators.Add(new Indicator
                    {
                        Date = record.Date,
                        Name = "MACD",
                        Value = record.MACD.Value,
                        Stock = stock
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
    }
}

// CSV mapping class
public class StockDataCsvRecord
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
    public decimal? MA20 { get; set; }
    public decimal? MA50 { get; set; }
    public decimal? RSI { get; set; }
    public decimal? MACD { get; set; }
}
