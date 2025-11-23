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

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
