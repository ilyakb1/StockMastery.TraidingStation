using Microsoft.AspNetCore.Mvc;
using TradingStation.Infrastructure.Repositories;
using TradingStation.Domain.Entities;

namespace TradingStation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly ITraderAccountRepository _accountRepository;
    private readonly IPositionRepository _positionRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<AccountsController> _logger;

    public AccountsController(
        ITraderAccountRepository accountRepository,
        IPositionRepository positionRepository,
        IOrderRepository orderRepository,
        ILogger<AccountsController> logger)
    {
        _accountRepository = accountRepository;
        _positionRepository = positionRepository;
        _orderRepository = orderRepository;
        _logger = logger;
    }

    /// <summary>
    /// Get all trading accounts
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AccountDto>>> GetAllAccounts()
    {
        var accounts = await _accountRepository.GetAllAsync();
        return Ok(accounts.Select(a => new AccountDto
        {
            Id = a.Id,
            Name = a.Name,
            InitialCapital = a.InitialCapital,
            CurrentEquity = a.CurrentCash, // Simplified - could calculate with current prices
            IsActive = a.IsActive,
            CreatedDate = a.CreatedDate
        }));
    }

    /// <summary>
    /// Get account by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccountDetailDto>> GetAccount(int id)
    {
        var account = await _accountRepository.GetByIdAsync(id);

        if (account == null)
            return NotFound($"Account {id} not found");

        return Ok(new AccountDetailDto
        {
            Id = account.Id,
            Name = account.Name,
            InitialCapital = account.InitialCapital,
            CurrentEquity = account.CurrentCash, // Simplified - could calculate with current prices
            IsActive = account.IsActive,
            CreatedDate = account.CreatedDate,
            TotalOrders = account.Orders.Count,
            TotalPositions = account.Positions.Count,
            OpenPositions = account.Positions.Count(p => p.Status == PositionStatus.Open)
        });
    }

    /// <summary>
    /// Create a new trading account
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AccountDto>> CreateAccount([FromBody] CreateAccountRequest request)
    {
        if (request.InitialCapital <= 0)
            return BadRequest("Initial capital must be greater than 0");

        var account = new TraderAccount
        {
            Name = request.Name,
            InitialCapital = request.InitialCapital,
            CurrentCash = request.InitialCapital, // Start with full capital
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        var created = await _accountRepository.AddAsync(account);

        _logger.LogInformation("Created account {AccountId}: {Name} with ${Capital:N2}",
            created.Id, created.Name, created.InitialCapital);

        var dto = new AccountDto
        {
            Id = created.Id,
            Name = created.Name,
            InitialCapital = created.InitialCapital,
            CurrentEquity = created.CurrentCash,
            IsActive = created.IsActive,
            CreatedDate = created.CreatedDate
        };

        return CreatedAtAction(nameof(GetAccount), new { id = created.Id }, dto);
    }

    /// <summary>
    /// Get positions for an account
    /// </summary>
    [HttpGet("{id}/positions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<PositionDto>>> GetAccountPositions(
        int id,
        [FromQuery] bool openOnly = false)
    {
        var account = await _accountRepository.GetByIdAsync(id);
        if (account == null)
            return NotFound($"Account {id} not found");

        var positions = openOnly
            ? await _positionRepository.GetOpenPositionsAsync(id)
            : await _positionRepository.GetByAccountIdAsync(id);

        return Ok(positions.Select(p => new PositionDto
        {
            Id = p.Id,
            Symbol = p.Symbol,
            EntryDate = p.EntryDate,
            EntryPrice = p.EntryPrice,
            Quantity = p.Quantity,
            StopLossPrice = p.StopLossPrice,
            StopLossDays = p.StopLossDays,
            Status = p.Status.ToString(),
            ExitDate = p.ExitDate,
            ExitPrice = p.ExitPrice,
            RealizedPL = p.RealizedPL,
            ExitReason = p.ExitReason
        }));
    }

    /// <summary>
    /// Get orders for an account
    /// </summary>
    [HttpGet("{id}/orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetAccountOrders(int id)
    {
        var account = await _accountRepository.GetByIdAsync(id);
        if (account == null)
            return NotFound($"Account {id} not found");

        var orders = await _orderRepository.GetByAccountIdAsync(id);

        return Ok(orders.Select(o => new OrderDto
        {
            Id = o.Id,
            Symbol = o.Symbol,
            OrderType = o.OrderType.ToString(),
            Quantity = o.Quantity,
            Price = o.Price,
            OrderDate = o.OrderDate,
            Status = o.Status.ToString()
        }));
    }
}

// DTOs
public class AccountDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal InitialCapital { get; set; }
    public decimal CurrentEquity { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class AccountDetailDto : AccountDto
{
    public int TotalOrders { get; set; }
    public int TotalPositions { get; set; }
    public int OpenPositions { get; set; }
}

public class CreateAccountRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal InitialCapital { get; set; }
}

public class PositionDto
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public decimal EntryPrice { get; set; }
    public int Quantity { get; set; }
    public decimal? StopLossPrice { get; set; }
    public int? StopLossDays { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ExitDate { get; set; }
    public decimal? ExitPrice { get; set; }
    public decimal? RealizedPL { get; set; }
    public string? ExitReason { get; set; }
}

public class OrderDto
{
    public int Id { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string OrderType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public DateTime OrderDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
