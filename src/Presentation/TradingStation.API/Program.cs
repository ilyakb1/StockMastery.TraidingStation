using Microsoft.EntityFrameworkCore;
using TradingStation.Infrastructure.Data;
using TradingStation.Infrastructure.Repositories;
using TradingStation.Contracts;
using TradingStation.TradingEngine;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Trading Station API", Version = "v1" });
});

// Database
builder.Services.AddDbContext<TradingStationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("TradingStation.Infrastructure")));

// Caching
builder.Services.AddMemoryCache();

// Repositories
builder.Services.AddScoped<IStockRepository, StockRepository>();
builder.Services.AddScoped<ITraderAccountRepository, TraderAccountRepository>();
builder.Services.AddScoped<IPositionRepository, PositionRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Trading Engine (Reusable)
builder.Services.AddScoped<IOrderExecutionService, OrderExecutionEngine>();
builder.Services.AddScoped<IPositionManager, PositionManager>();
builder.Services.AddScoped<IRiskManager, RiskManager>();
builder.Services.AddScoped<IAccountManager, AccountManager>();

// Backtesting
builder.Services.AddScoped<TradingStation.Backtesting.BacktestRunner>();

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TradingStationDbContext>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Trading Station API v1"));
}

// Health check endpoint
app.MapHealthChecks("/health");

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Run migrations on startup in Docker environment
if (app.Environment.EnvironmentName == "Docker")
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<TradingStationDbContext>();
        db.Database.Migrate();

        // Seed test stock data if no stocks exist
        if (!db.Stocks.Any())
        {
            var stocks = new[]
            {
                new TradingStation.Domain.Entities.Stock
                {
                    Symbol = "AAPL",
                    Market = "US",
                    Name = "Apple Inc.",
                    Sector = "Technology",
                    LastUpdated = DateTime.UtcNow
                },
                new TradingStation.Domain.Entities.Stock
                {
                    Symbol = "MSFT",
                    Market = "US",
                    Name = "Microsoft Corporation",
                    Sector = "Technology",
                    LastUpdated = DateTime.UtcNow
                },
                new TradingStation.Domain.Entities.Stock
                {
                    Symbol = "GOOGL",
                    Market = "US",
                    Name = "Alphabet Inc.",
                    Sector = "Technology",
                    LastUpdated = DateTime.UtcNow
                },
                new TradingStation.Domain.Entities.Stock
                {
                    Symbol = "AMZN",
                    Market = "US",
                    Name = "Amazon.com Inc.",
                    Sector = "Consumer Cyclical",
                    LastUpdated = DateTime.UtcNow
                },
                new TradingStation.Domain.Entities.Stock
                {
                    Symbol = "TSLA",
                    Market = "US",
                    Name = "Tesla Inc.",
                    Sector = "Automotive",
                    LastUpdated = DateTime.UtcNow
                }
            };

            db.Stocks.AddRange(stocks);
            db.SaveChanges();

            // Add sample historical price data for each stock
            var baseDate = new DateTime(2024, 1, 1);
            var random = new Random(42); // Seed for reproducibility

            foreach (var stock in stocks)
            {
                var startPrice = 100m + (decimal)(random.NextDouble() * 100); // $100-$200 starting price

                for (int i = 0; i < 365; i++) // 1 year of daily data
                {
                    var date = baseDate.AddDays(i);
                    var priceVariation = (decimal)(random.NextDouble() * 0.04 - 0.02); // -2% to +2% daily change
                    var dayPrice = startPrice * (1 + priceVariation);
                    var high = dayPrice * 1.01m;
                    var low = dayPrice * 0.99m;

                    var stockPrice = new TradingStation.Domain.Entities.StockPrice
                    {
                        Symbol = stock.Symbol,
                        Date = date,
                        Open = startPrice,
                        High = high,
                        Low = low,
                        Close = dayPrice,
                        AdjustedClose = dayPrice,
                        Volume = (long)(1000000 + random.Next(1000000, 10000000))
                    };

                    db.StockPrices.Add(stockPrice);
                    startPrice = dayPrice; // Next day starts at previous close
                }
            }

            db.SaveChanges();
            Console.WriteLine("Test stock data seeded successfully");
        }
    }
}

app.Run();
