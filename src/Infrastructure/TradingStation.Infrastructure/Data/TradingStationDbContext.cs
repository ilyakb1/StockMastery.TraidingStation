using Microsoft.EntityFrameworkCore;
using TradingStation.Domain.Entities;

namespace TradingStation.Infrastructure.Data;

public class TradingStationDbContext : DbContext
{
    public TradingStationDbContext(DbContextOptions<TradingStationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<StockPrice> StockPrices => Set<StockPrice>();
    public DbSet<Indicator> Indicators => Set<Indicator>();
    public DbSet<TraderAccount> TraderAccounts => Set<TraderAccount>();
    public DbSet<Position> Positions => Set<Position>();
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Stock configuration
        modelBuilder.Entity<Stock>(entity =>
        {
            entity.HasKey(e => e.Symbol);
            entity.Property(e => e.Symbol).HasMaxLength(10);
            entity.Property(e => e.Market).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Sector).HasMaxLength(50);

            entity.HasIndex(e => e.Market);
        });

        // StockPrice configuration
        modelBuilder.Entity<StockPrice>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Symbol).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Open).HasColumnType("decimal(18,4)");
            entity.Property(e => e.High).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Low).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Close).HasColumnType("decimal(18,4)");
            entity.Property(e => e.AdjustedClose).HasColumnType("decimal(18,4)");

            entity.HasIndex(e => new { e.Symbol, e.Date }).IsUnique();
            entity.HasIndex(e => e.Date);

            entity.HasOne(e => e.Stock)
                .WithMany(s => s.Prices)
                .HasForeignKey(e => e.Symbol);
        });

        // Indicator configuration
        modelBuilder.Entity<Indicator>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Macd).HasColumnType("decimal(18,8)");
            entity.Property(e => e.MacdSignal).HasColumnType("decimal(18,8)");
            entity.Property(e => e.MacdHistogram).HasColumnType("decimal(18,8)");
            entity.Property(e => e.Sma200).HasColumnType("decimal(18,4)");
            entity.Property(e => e.Sma50).HasColumnType("decimal(18,4)");
            entity.Property(e => e.VolMA20).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Rsi14).HasColumnType("decimal(18,4)");

            entity.HasOne(e => e.StockPrice)
                .WithOne(sp => sp.Indicator)
                .HasForeignKey<Indicator>(e => e.StockPriceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TraderAccount configuration
        modelBuilder.Entity<TraderAccount>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.InitialCapital).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CurrentCash).HasColumnType("decimal(18,2)");
        });

        // Position configuration
        modelBuilder.Entity<Position>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Symbol).HasMaxLength(10).IsRequired();
            entity.Property(e => e.EntryPrice).HasColumnType("decimal(18,4)");
            entity.Property(e => e.ExitPrice).HasColumnType("decimal(18,4)");
            entity.Property(e => e.StopLossPrice).HasColumnType("decimal(18,4)");
            entity.Property(e => e.RealizedPL).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ExitReason).HasMaxLength(200);

            entity.HasIndex(e => new { e.AccountId, e.Status });

            entity.HasOne(e => e.Account)
                .WithMany(a => a.Positions)
                .HasForeignKey(e => e.AccountId);
        });

        // Order configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Symbol).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Price).HasColumnType("decimal(18,4)");

            entity.HasIndex(e => new { e.AccountId, e.Status });

            entity.HasOne(e => e.Account)
                .WithMany(a => a.Orders)
                .HasForeignKey(e => e.AccountId);
        });
    }
}
