namespace TradingStation.Contracts;

/// <summary>
/// Manages trading account operations
/// </summary>
public interface IAccountManager
{
    /// <summary>
    /// Gets account information
    /// </summary>
    Task<AccountInfo> GetAccountAsync(int accountId);

    /// <summary>
    /// Reserves funds for an order
    /// </summary>
    Task<bool> ReserveFundsAsync(int accountId, decimal amount);

    /// <summary>
    /// Releases reserved funds
    /// </summary>
    Task<bool> ReleaseFundsAsync(int accountId, decimal amount);

    /// <summary>
    /// Updates account balance after a trade
    /// </summary>
    Task UpdateBalanceAsync(int accountId, decimal profitLoss);

    /// <summary>
    /// Gets available balance for trading
    /// </summary>
    decimal GetAvailableBalance(AccountInfo account);
}
