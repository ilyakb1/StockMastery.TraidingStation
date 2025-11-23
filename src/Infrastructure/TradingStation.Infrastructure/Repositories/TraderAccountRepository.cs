using TradingStation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TradingStation.Infrastructure.Data;

namespace TradingStation.Infrastructure.Repositories;

public interface ITraderAccountRepository
{
    Task<TraderAccount?> GetByIdAsync(int id);
    Task<IEnumerable<TraderAccount>> GetAllAsync();
    Task<TraderAccount> AddAsync(TraderAccount account);
    Task UpdateAsync(TraderAccount account);
}

public class TraderAccountRepository : ITraderAccountRepository
{
    private readonly TradingStationDbContext _context;

    public TraderAccountRepository(TradingStationDbContext context)
    {
        _context = context;
    }

    public async Task<TraderAccount?> GetByIdAsync(int id)
    {
        return await _context.TraderAccounts
            .Include(a => a.Positions)
            .Include(a => a.Orders)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<IEnumerable<TraderAccount>> GetAllAsync()
    {
        return await _context.TraderAccounts
            .Include(a => a.Positions)
            .Include(a => a.Orders)
            .ToListAsync();
    }

    public async Task<TraderAccount> AddAsync(TraderAccount account)
    {
        _context.TraderAccounts.Add(account);
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task UpdateAsync(TraderAccount account)
    {
        _context.TraderAccounts.Update(account);
        await _context.SaveChangesAsync();
    }
}
