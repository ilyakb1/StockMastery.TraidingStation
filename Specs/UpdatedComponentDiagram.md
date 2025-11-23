# Trading Station - Updated Component Diagrams with Trading Engine

## 1. System Component Diagram (Updated)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Interface Layer                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        React Frontend                             │  │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │
│  │  │  Chart          │  │   Trading    │  │   Backtest           │ │  │
│  │  │  Components     │  │   Panel      │  │   Dashboard          │ │  │
│  │  └────────┬────────┘  └──────┬───────┘  └──────────┬───────────┘ │  │
│  │           │                   │                      │             │  │
│  │  ┌────────┴───────────────────┴──────────────────────┴───────────┐ │  │
│  │  │                    Redux Store                                 │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │  │
│  │  │  │  Stocks  │  │ Trading  │  │ Account  │  │  Backtest    │  │ │  │
│  │  │  │  Slice   │  │  Slice   │  │  Slice   │  │    Slice     │  │ │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │ │  │
│  │  └────────┬───────────────────────┬──────────────────────────────┘ │  │
│  │           │                       │                                │  │
│  │  ┌────────┴────────┐    ┌─────────┴──────────┐                    │  │
│  │  │   API Service   │    │  SignalR Service   │                    │  │
│  │  └────────┬────────┘    └─────────┬──────────┘                    │  │
│  └───────────┼──────────────────────┼─────────────────────────────────┘  │
└──────────────┼──────────────────────┼────────────────────────────────────┘
               │ HTTP/REST            │ WebSocket
               │                      │
┌──────────────┼──────────────────────┼────────────────────────────────────┐
│              │                      │         API Layer                  │
│  ┌───────────▼──────────────────────▼───────────────────────────────┐   │
│  │                      ASP.NET Core Web API                         │   │
│  │  ┌────────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │   │
│  │  │  Stocks    │  │ Backtest  │  │ Accounts  │  │  Strategy    │ │   │
│  │  │ Controller │  │Controller │  │Controller │  │  Controller  │ │   │
│  │  └─────┬──────┘  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘ │   │
│  └────────┼────────────────┼──────────────┼────────────────┼─────────┘   │
└───────────┼────────────────┼──────────────┼────────────────┼─────────────┘
            │                │              │                │
┌───────────┼────────────────┼──────────────┼────────────────┼─────────────┐
│           │                │              │                │             │
│  ┌────────▼────────────────▼──────────────▼────────────────▼──────────┐ │
│  │                    Application Services                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │   Stock      │  │  Backtest    │  │   Live Trading           │ │ │
│  │  │   Service    │  │  Service     │  │   Service (Future)       │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘ │ │
│  └─────────┼──────────────────┼─────────────────────┼─────────────────┘ │
└────────────┼──────────────────┼─────────────────────┼───────────────────┘
             │                  │                     │
             │    ┌─────────────┴─────────────────────┘
             │    │
┌────────────┼────▼───────────────────────────────────────────────────────┐
│            │    │        Backtesting & Trading Engines                  │
│  ┌─────────▼────┴───────────────────────────────────────────────────┐  │
│  │                  Backtesting Engine                               │  │
│  │  - BacktestRunner                                                 │  │
│  │  - Strategy Interface & Implementations                           │  │
│  │  - Performance Metrics Calculator                                 │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
│                              │                                          │
│  ┌───────────────────────────▼───────────────────────────────────────┐  │
│  │           Trading Engine (Reusable Core DLL)                      │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │  - OrderExecutionEngine   - PositionManager                │   │  │
│  │  │  - RiskManager            - AccountManager                 │   │  │
│  │  │  - StopLossEvaluator      - CommissionCalculator           │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ Uses
┌──────────────────────────────▼──────────────────────────────────────────┐
│                      Contracts Layer (Interfaces)                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  IMarketDataProvider       - GetPriceAsync(symbol, asOfTime)    │   │
│  │  IIndicatorProvider        - GetIndicatorsAsync(...)            │   │
│  │  IOrderExecutionService    - ExecuteOrderAsync(...)             │   │
│  │  IPositionManager          - OpenPosition / ClosePosition       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │ Implemented by     │                    │ Implemented by
          ▼                    ▼                    ▼
┌──────────────────┐  ┌────────────────┐  ┌────────────────────┐
│ Data.Backtesting │  │     Domain     │  │    Data.Live       │
│                  │  │     Layer      │  │   (Future)         │
│ ┌──────────────┐ │  │                │  │ ┌────────────────┐ │
│ │ Backtesting  │ │  │  Core Models:  │  │ │ Live Market    │ │
│ │ Market Data  │ │  │  - Stock       │  │ │ Data Provider  │ │
│ │ Provider     │ │  │  - Position    │  │ │ - External API │ │
│ │              │ │  │  - Order       │  │ │ - Real-time    │ │
│ │ Features:    │ │  │  - Account     │  │ └────────────────┘ │
│ │ • Simulation │ │  └────────────────┘  └────────────────────┘
│ │   Clock      │ │
│ │ • Temporal   │ │
│ │   Guards     │ │
│ │ • No Future  │ │
│ │   Data       │ │
│ └──────────────┘ │
└──────────────────┘
          │
          │ Reads from
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │  Data Access     │  │  File System     │  │  SignalR Hubs      │   │
│  │  - EF Core       │  │  - Stock Reader  │  │  - Trading Hub     │   │
│  │  - Repositories  │  │  - CSV Parser    │  │  - Notification    │   │
│  └──────────────────┘  └──────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │                           │
          ▼                           ▼
┌──────────────────┐        ┌──────────────────────┐
│  SQL Server DB   │        │  File System         │
│  - Stocks        │        │  C:\Data\AU\...      │
│  - Positions     │        │  - *.ind files       │
│  - Orders        │        │  - OHLCV + Indicators│
│  - Accounts      │        └──────────────────────┘
└──────────────────┘
```

## 2. Trading Engine Component Detail

```
┌─────────────────────────────────────────────────────────────────────┐
│              TradingStation.TradingEngine (Core DLL)                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  OrderExecutionEngine                         │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  ExecuteOrderAsync(order, dataProvider, currentTime)    │  │ │
│  │  │    1. Validate order                                    │  │ │
│  │  │    2. Get current price (from dataProvider)             │  │ │
│  │  │    3. Check sufficient funds                            │  │ │
│  │  │    4. Calculate commission                              │  │ │
│  │  │    5. Execute trade                                     │  │ │
│  │  │    6. Update position                                   │  │ │
│  │  │    7. Return result                                     │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    PositionManager                            │ │
│  │  - OpenPositionAsync(symbol, price, qty, time)               │ │
│  │  - ClosePositionAsync(position, exitPrice, exitTime)         │ │
│  │  - CalculateUnrealizedPL(position, currentPrice)             │ │
│  │  - GetOpenPositions(accountId)                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                      RiskManager                              │ │
│  │  - ValidatePositionSize(order, account)                      │ │
│  │  - ValidateMaxDrawdown(account)                              │ │
│  │  - EvaluateStopLoss(position, price, time)                   │ │
│  │  - CalculatePositionSize(balance, riskPercent)               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    AccountManager                             │ │
│  │  - ReserveFunds(accountId, amount)                           │ │
│  │  - ReleaseFunds(accountId, amount)                           │ │
│  │  - UpdateBalance(accountId, profitLoss)                      │ │
│  │  - GetAvailableBalance(account)                              │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  CommissionCalculator                         │ │
│  │  - CalculateCommission(quantity, price)                      │ │
│  │  - ApplyCommissionRules(orderType)                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Dependencies: TradingStation.Contracts, TradingStation.Domain    │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Backtesting Data Flow with Temporal Guards

```
User Initiates Backtest
         │
         ▼
┌────────────────────┐
│ BacktestController │
│ POST /api/backtest │
└────────┬───────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│                    BacktestService                             │
│  1. Create BacktestRunner                                      │
│  2. Initialize BacktestingMarketDataProvider                   │
│     - Set simulation time to START date                        │
│  3. Load strategy                                              │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│                    BacktestRunner                              │
│                                                                │
│  While currentTime <= endDate:                                │
│    │                                                           │
│    ├─▶ 1. AdvanceTime(currentTime)  ◄──── TEMPORAL GUARD     │
│    │      └─ dataProvider._simulationTime = currentTime       │
│    │                                                           │
│    ├─▶ 2. Evaluate Stop Losses                               │
│    │      └─ GetPriceAsync(symbol, currentTime)              │
│    │         ✓ Allowed: currentTime <= _simulationTime       │
│    │                                                           │
│    ├─▶ 3. Generate Strategy Signals                          │
│    │      └─ GetHistoricalPricesAsync(start, end)            │
│    │         ✓ Filter: prices.Where(p => p.Date <= currentTime)
│    │                                                           │
│    ├─▶ 4. Execute Orders via TradingEngine                   │
│    │      └─ orderExecution.ExecuteAsync(order, dataProvider)│
│    │         └─ GetPriceAsync(symbol, currentTime)           │
│    │            ✓ Temporal check passes                       │
│    │                                                           │
│    └─▶ 5. currentTime = GetNextTradingDay(currentTime)       │
│                                                                │
│  Return BacktestResult                                        │
└────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│           BacktestingMarketDataProvider                        │
│                                                                │
│  private DateTime _simulationTime;  ◄──── CRITICAL            │
│                                                                │
│  GetPriceAsync(symbol, asOfTime):                            │
│    if (asOfTime > _simulationTime):                          │
│       throw FutureDataAccessException ◄──── GUARD            │
│                                                                │
│    return prices                                              │
│      .Where(p => p.Date <= asOfTime)  ◄──── FILTER           │
│      .OrderByDescending(p => p.Date)                          │
│      .First()                                                 │
│                                                                │
│  GetHistoricalPricesAsync(start, end):                       │
│    effectiveEnd = min(end, _simulationTime) ◄──── CLAMP      │
│    return prices                                              │
│      .Where(p => p.Date >= start && p.Date <= effectiveEnd)  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## 4. Comparison: Backtesting vs Live Data Providers

```
┌─────────────────────────────────────────────────────────────────────┐
│                    IMarketDataProvider Interface                    │
│  - GetPriceAsync(symbol, asOfTime)                                 │
│  - GetHistoricalPricesAsync(symbol, start, end)                    │
│  - GetCurrentTime()                                                │
└─────────────────────────────────────────────────────────────────────┘
                │                                    │
    ┌───────────┴─────────────┐         ┌───────────┴────────────────┐
    │                         │         │                            │
┌───▼──────────────────────┐  │  ┌──────▼────────────────────────┐  │
│ Backtesting Provider     │  │  │  Live Trading Provider        │  │
├──────────────────────────┤  │  ├───────────────────────────────┤  │
│                          │  │  │                               │  │
│ Time Source:             │  │  │ Time Source:                  │  │
│  • Simulation clock      │  │  │  • DateTime.UtcNow            │  │
│  • Manually advanced     │  │  │  • Real-time                  │  │
│                          │  │  │                               │  │
│ Data Source:             │  │  │ Data Source:                  │  │
│  • Historical files      │  │  │  • Live API                   │  │
│  • Database cache        │  │  │  • Database (historical)      │  │
│                          │  │  │                               │  │
│ Temporal Safety:         │  │  │ Temporal Safety:              │  │
│  • ✓ Enforced            │  │  │  • N/A (always current)       │  │
│  • ✓ Future data blocked │  │  │                               │  │
│  • ✓ Exception on leak   │  │  │                               │  │
│                          │  │  │                               │  │
│ Performance:             │  │  │ Performance:                  │  │
│  • Fast (cached)         │  │  │  • Network latency            │  │
│  • Predictable           │  │  │  • Rate limits                │  │
│                          │  │  │                               │  │
│ Use Cases:               │  │  │ Use Cases:                    │  │
│  • Strategy testing      │  │  │  • Live trading               │  │
│  • Historical analysis   │  │  │  • Real-time monitoring       │  │
│  • Optimization          │  │  │  • Production execution       │  │
└──────────────────────────┘  │  └───────────────────────────────┘  │
                              │                                     │
                              └─────────────────────────────────────┘
                         Both use SAME TradingEngine DLL
```

## 5. Project Dependencies Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                     TradingStation.API                           │
│                    (Presentation Layer)                          │
└────────┬────────────────────────┬────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────┐  ┌─────────────────────────────────────┐
│  Application Layer  │  │   TradingStation.Backtesting        │
│  - Services         │  │   (Backtest Orchestration)          │
└──────┬──────────────┘  └────────┬────────────────────────────┘
       │                          │
       │                          │
       └──────────┬───────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────────────┐
    │   TradingStation.TradingEngine              │
    │   (Reusable Trading Logic - Core DLL)       │
    └──────┬──────────────────────────────────────┘
           │ depends on
           ▼
    ┌─────────────────────────────────────────────┐
    │   TradingStation.Contracts                  │
    │   (Interfaces: IMarketDataProvider, etc.)   │
    └──────┬──────────────────────────────────────┘
           │ implemented by
           │
    ┌──────┴─────────────────────┬────────────────────────┐
    │                            │                        │
    ▼                            ▼                        ▼
┌────────────────┐  ┌────────────────────┐  ┌───────────────────┐
│ Data.Backtesting  │  Domain Layer       │  │ Data.Live         │
│ (Temporal Guards) │  (Core Models)      │  │ (Future)          │
└────────────────┘  └────────────────────┘  └───────────────────┘
    │                            │
    │                            │
    └──────────┬─────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────────┐
    │   TradingStation.Infrastructure             │
    │   (EF Core, Repositories, File I/O)         │
    └─────────────────────────────────────────────┘
```

## 6. Temporal Safety Enforcement Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                   TEMPORAL SAFETY LAYERS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Layer 1: Interface Design                                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ All methods accept DateTime parameter                         │ │
│  │ GetPriceAsync(symbol, asOfTime) ◄── Forces time awareness    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 2: Data Provider Implementation                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Private simulation clock: _simulationTime                     │ │
│  │ All queries check: asOfTime <= _simulationTime               │ │
│  │ Throws FutureDataAccessException if violated                 │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 3: Data Filtering                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ All database/file queries filter by date                     │ │
│  │ WHERE Date <= _simulationTime                                │ │
│  │ Results cached per time period                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 4: Indicator Calculation                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Indicators calculated from historical data only              │ │
│  │ No pre-calculated future indicators                          │ │
│  │ Calculate on-the-fly during backtest                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 5: Strategy Constraints                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Strategy receives only IMarketDataProvider                   │ │
│  │ Cannot access repository or file system directly            │ │
│  │ Forced to go through temporal guards                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Layer 6: Unit Tests                                               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Test: Accessing future data throws exception                │ │
│  │ Test: Results contain only past data                         │ │
│  │ Test: Simulation time cannot go backward                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

This updated architecture ensures that:
1. **Trading logic is reusable** - Same DLL for backtesting and live trading
2. **No future data leakage** - Multiple layers of temporal safety
3. **Testable** - Each component can be tested independently
4. **Maintainable** - Clear separation of concerns
5. **Production-ready** - Same code runs in both environments
