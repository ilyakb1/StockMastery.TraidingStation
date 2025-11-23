using TradingStation.Contracts;
using Microsoft.Extensions.Logging;

namespace TradingStation.TradingEngine;

public class AccountManager : IAccountManager
{
    private readonly ILogger<AccountManager> _logger;
    private readonly Dictionary<int, AccountInfo> _accounts = new(); // In-memory for now

    public AccountManager(ILogger<AccountManager> logger)
    {
        _logger = logger;
    }

    public Task<AccountInfo> GetAccountAsync(int accountId)
    {
        if (!_accounts.ContainsKey(accountId))
        {
            // Create a default account for testing
            _accounts[accountId] = new AccountInfo
            {
                Id = accountId,
                Name = $"Account {accountId}",
                InitialCapital = 100000m,
                CurrentCash = 100000m,
                IsActive = true
            };
        }

        return Task.FromResult(_accounts[accountId]);
    }

    public Task<bool> ReserveFundsAsync(int accountId, decimal amount)
    {
        if (!_accounts.ContainsKey(accountId))
            return Task.FromResult(false);

        var account = _accounts[accountId];

        if (account.CurrentCash < amount)
        {
            _logger.LogWarning(
                "Insufficient funds for account {AccountId}: Required ${Required:N2}, Available ${Available:N2}",
                accountId, amount, account.CurrentCash);
            return Task.FromResult(false);
        }

        // Deduct funds
        _accounts[accountId] = new AccountInfo
        {
            Id = account.Id,
            Name = account.Name,
            InitialCapital = account.InitialCapital,
            CurrentCash = account.CurrentCash - amount,
            IsActive = account.IsActive
        };

        _logger.LogDebug(
            "Reserved ${Amount:N2} from account {AccountId}. New balance: ${Balance:N2}",
            amount, accountId, _accounts[accountId].CurrentCash);

        return Task.FromResult(true);
    }

    public Task<bool> ReleaseFundsAsync(int accountId, decimal amount)
    {
        if (!_accounts.ContainsKey(accountId))
            return Task.FromResult(false);

        var account = _accounts[accountId];

        // Add funds back
        _accounts[accountId] = new AccountInfo
        {
            Id = account.Id,
            Name = account.Name,
            InitialCapital = account.InitialCapital,
            CurrentCash = account.CurrentCash + amount,
            IsActive = account.IsActive
        };

        _logger.LogDebug(
            "Released ${Amount:N2} to account {AccountId}. New balance: ${Balance:N2}",
            amount, accountId, _accounts[accountId].CurrentCash);

        return Task.FromResult(true);
    }

    public Task UpdateBalanceAsync(int accountId, decimal profitLoss)
    {
        if (!_accounts.ContainsKey(accountId))
            throw new InvalidOperationException($"Account {accountId} not found");

        var account = _accounts[accountId];

        _accounts[accountId] = new AccountInfo
        {
            Id = account.Id,
            Name = account.Name,
            InitialCapital = account.InitialCapital,
            CurrentCash = account.CurrentCash + profitLoss,
            IsActive = account.IsActive
        };

        _logger.LogInformation(
            "Updated account {AccountId} balance: P&L ${PL:N2}, New balance: ${Balance:N2}",
            accountId, profitLoss, _accounts[accountId].CurrentCash);

        return Task.CompletedTask;
    }

    public decimal GetAvailableBalance(AccountInfo account)
    {
        return account.CurrentCash;
    }
}
