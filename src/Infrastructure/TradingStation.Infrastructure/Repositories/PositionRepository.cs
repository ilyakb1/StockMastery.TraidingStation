using TradingStation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TradingStation.Infrastructure.Data;

namespace TradingStation.Infrastructure.Repositories;

public interface IPositionRepository
{
    Task<Position?> GetByIdAsync(int id);
    Task<IEnumerable<Position>> GetByAccountIdAsync(int accountId);
    Task<IEnumerable<Position>> GetOpenPositionsAsync(int accountId);
    Task<Position> AddAsync(Position position);
    Task UpdateAsync(Position position);
    Task<IEnumerable<Position>> GetAllAsync();
}

public class PositionRepository : IPositionRepository
{
    private readonly TradingStationDbContext _context;

    public PositionRepository(TradingStationDbContext context)
    {
        _context = context;
    }

    public async Task<Position?> GetByIdAsync(int id)
    {
        return await _context.Positions
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Position>> GetByAccountIdAsync(int accountId)
    {
        return await _context.Positions
            .Where(p => p.AccountId == accountId)
            .Include(p => p.Account)
            .OrderByDescending(p => p.EntryDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Position>> GetOpenPositionsAsync(int accountId)
    {
        return await _context.Positions
            .Where(p => p.AccountId == accountId && p.Status == PositionStatus.Open)
            .Include(p => p.Account)
            .ToListAsync();
    }

    public async Task<Position> AddAsync(Position position)
    {
        _context.Positions.Add(position);
        await _context.SaveChangesAsync();
        return position;
    }

    public async Task UpdateAsync(Position position)
    {
        _context.Positions.Update(position);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Position>> GetAllAsync()
    {
        return await _context.Positions
            .Include(p => p.Account)
            .OrderByDescending(p => p.EntryDate)
            .ToListAsync();
    }
}
