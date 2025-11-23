using TradingStation.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TradingStation.Infrastructure.Data;

namespace TradingStation.Infrastructure.Repositories;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(int id);
    Task<IEnumerable<Order>> GetByAccountIdAsync(int accountId);
    Task<Order> AddAsync(Order order);
    Task UpdateAsync(Order order);
    Task<IEnumerable<Order>> GetAllAsync();
}

public class OrderRepository : IOrderRepository
{
    private readonly TradingStationDbContext _context;

    public OrderRepository(TradingStationDbContext context)
    {
        _context = context;
    }

    public async Task<Order?> GetByIdAsync(int id)
    {
        return await _context.Orders
            .Include(o => o.Account)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<IEnumerable<Order>> GetByAccountIdAsync(int accountId)
    {
        return await _context.Orders
            .Where(o => o.AccountId == accountId)
            .Include(o => o.Account)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();
    }

    public async Task<Order> AddAsync(Order order)
    {
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task UpdateAsync(Order order)
    {
        _context.Orders.Update(order);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Order>> GetAllAsync()
    {
        return await _context.Orders
            .Include(o => o.Account)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();
    }
}
