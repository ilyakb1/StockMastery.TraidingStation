# Trading Station - Component Diagrams

## 1. System Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Interface Layer                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        React Frontend                             │  │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │
│  │  │  Chart          │  │   Trading    │  │   Stock Selection    │ │  │
│  │  │  Components     │  │   Panel      │  │   Components         │ │  │
│  │  └────────┬────────┘  └──────┬───────┘  └──────────┬───────────┘ │  │
│  │           │                   │                      │             │  │
│  │  ┌────────┴───────────────────┴──────────────────────┴───────────┐ │  │
│  │  │                    Redux Store                                 │ │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │  │
│  │  │  │  Stocks  │  │ Trading  │  │ Account  │  │    Chart     │  │ │  │
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
│  │  │  Stocks    │  │  Trading  │  │ Accounts  │  │  Backtest    │ │   │
│  │  │ Controller │  │Controller │  │Controller │  │  Controller  │ │   │
│  │  └─────┬──────┘  └─────┬─────┘  └─────┬─────┘  └──────┬───────┘ │   │
│  │  ┌─────┴────────────────┴──────────────┴────────────────┴───────┐ │   │
│  │  │                    Middleware Layer                           │ │   │
│  │  │  - Exception Handling  - CORS  - Authentication              │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │                    SignalR Hubs                               │ │   │
│  │  │  - TradingHub   - NotificationHub                            │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────┬──────────────────────────────────────┘   │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────────┐
│                               │     Application Layer                    │
│  ┌────────────────────────────▼──────────────────────────────────────┐  │
│  │                    Application Services                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐   │  │
│  │  │   Stock      │  │   Trading    │  │    Backtest           │   │  │
│  │  │   Service    │  │   Service    │  │    Service            │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘   │  │
│  │  ┌──────┴──────────────────┴──────────────────────┴────────────┐  │  │
│  │  │                   DTOs & Mapping (AutoMapper)               │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │              Validators (FluentValidation)                  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────┬──────────────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────────┐
│                               │         Domain Layer                     │
│  ┌────────────────────────────▼──────────────────────────────────────┐  │
│  │                       Domain Models                               │  │
│  │  ┌────────┐  ┌──────────┐  ┌─────────┐  ┌────────────────────┐   │  │
│  │  │ Stock  │  │ Position │  │  Order  │  │  TraderAccount     │   │  │
│  │  └────────┘  └──────────┘  └─────────┘  └────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Domain Services                               │  │
│  │  - IOrderExecutionService  - IProfitLossCalculator               │  │
│  │  - IStopLossEvaluator                                            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                  Repository Interfaces                            │  │
│  │  - IStockRepository  - ITraderAccountRepository                  │  │
│  │  - IPositionRepository  - IOrderRepository                       │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │ Implements
┌───────────────────────────────┼──────────────────────────────────────────┐
│                               │    Infrastructure Layer                  │
│  ┌────────────────────────────▼──────────────────────────────────────┐  │
│  │                  Repository Implementations                       │  │
│  │  - StockRepository  - TraderAccountRepository                    │  │
│  │  - PositionRepository  - OrderRepository                         │  │
│  └────────────────────────────┬──────────────────────────────────────┘  │
│  ┌────────────────────────────▼──────────────────────────────────────┐  │
│  │                  Entity Framework Core                            │  │
│  │  - TradingStationDbContext                                       │  │
│  │  - Migrations                                                    │  │
│  └────────────────────────────┬──────────────────────────────────────┘  │
│  ┌────────────────────────────┼──────────────────────────────────────┐  │
│  │     File System Access     │       External Services              │  │
│  │  - StockFileReader         │  - Caching Service                   │  │
│  │  - CsvParser               │  - Logging Service                   │  │
│  └────────────────────────────┴──────────────────────────────────────┘  │
└────────────────────────────┬──────────────┬──────────────────────────────┘
                             │              │
                    ┌────────▼──────┐  ┌────▼─────────┐
                    │  SQL Server   │  │ File System  │
                    │   Database    │  │ Stock Data   │
                    └───────────────┘  └──────────────┘
```

## 2. Frontend Component Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                           App.tsx                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     Router (React Router)                    │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │ │
│  │  │  Dashboard     │  │   Strategy     │  │  Backtest      │ │ │
│  │  │  Page          │  │   Page         │  │  Results Page  │ │ │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼─────────┐    ┌──────────▼────────┐    ┌─────────▼──────────┐
│  Chart Module   │    │  Trading Module   │    │  Stock Module      │
│  ┌────────────┐ │    │  ┌──────────────┐ │    │  ┌───────────────┐ │
│  │Candlestick │ │    │  │ Order Panel  │ │    │  │ Stock         │ │
│  │Chart       │ │    │  └──────────────┘ │    │  │ Selector      │ │
│  └────────────┘ │    │  ┌──────────────┐ │    │  └───────────────┘ │
│  ┌────────────┐ │    │  │ Position     │ │    │  ┌───────────────┐ │
│  │Volume      │ │    │  │ List         │ │    │  │ Market        │ │
│  │Chart       │ │    │  └──────────────┘ │    │  │ Selector      │ │
│  └────────────┘ │    │  ┌──────────────┐ │    │  └───────────────┘ │
│  ┌────────────┐ │    │  │ Account      │ │    │  ┌───────────────┐ │
│  │Indicators  │ │    │  │ Summary      │ │    │  │ Stock         │ │
│  │Overlay     │ │    │  └──────────────┘ │    │  │ Details       │ │
│  └────────────┘ │    │  ┌──────────────┐ │    │  └───────────────┘ │
│  ┌────────────┐ │    │  │ Stop Loss    │ │    └────────────────────┘
│  │Position    │ │    │  │ Config       │ │
│  │Markers     │ │    │  └──────────────┘ │
│  └────────────┘ │    └───────────────────┘
└─────────────────┘
        │                        │                         │
        └────────────────────────┼─────────────────────────┘
                                 │
                     ┌───────────▼──────────┐
                     │    Redux Store       │
                     │  ┌────────────────┐  │
                     │  │  Stocks Slice  │  │
                     │  └────────────────┘  │
                     │  ┌────────────────┐  │
                     │  │ Trading Slice  │  │
                     │  └────────────────┘  │
                     │  ┌────────────────┐  │
                     │  │ Account Slice  │  │
                     │  └────────────────┘  │
                     │  ┌────────────────┐  │
                     │  │  Chart Slice   │  │
                     │  └────────────────┘  │
                     └──────────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
        ┌────────▼──────┐  ┌────▼──────┐  ┌────▼──────────┐
        │  API Service  │  │  SignalR  │  │  Local        │
        │               │  │  Service  │  │  Storage      │
        └───────────────┘  └───────────┘  └───────────────┘
                 │               │
                 └───────┬───────┘
                         │
                    ┌────▼─────┐
                    │ Backend  │
                    │   API    │
                    └──────────┘
```

## 3. Backend Layer Dependency Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          API Layer                                  │
│  Controllers → Middleware → SignalR Hubs                            │
│       │                           │                                 │
│       └───────────────┬───────────┘                                 │
└───────────────────────┼─────────────────────────────────────────────┘
                        │ depends on
┌───────────────────────▼─────────────────────────────────────────────┐
│                    Application Layer                                │
│  Application Services → DTOs → Validators                           │
│       │                                                             │
│       └───────────────┬─────────────────────────────────────────────┤
└───────────────────────┼─────────────────────────────────────────────┘
                        │ depends on
┌───────────────────────▼─────────────────────────────────────────────┐
│                       Domain Layer                                  │
│  Domain Models ← Domain Services → Repository Interfaces            │
│                                                                     │
│  (No dependencies on outer layers - Pure Business Logic)           │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ implemented by
┌───────────────────────▼─────────────────────────────────────────────┐
│                   Infrastructure Layer                              │
│  Repository Implementations → EF Core → Database                    │
│  File System Access → External Services                            │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. Data Flow Diagrams

### 4.1 Stock Data Loading Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│          │     │             │     │              │     │            │
│  User    │────▶│  React      │────▶│  Redux       │────▶│  API       │
│  Action  │     │  Component  │     │  Action      │     │  Service   │
│          │     │             │     │              │     │            │
└──────────┘     └─────────────┘     └──────────────┘     └─────┬──────┘
                                                                  │
                                                                  │ HTTP GET
                                                                  │
                                                          ┌───────▼────────┐
                                                          │  Stocks        │
                                                          │  Controller    │
                                                          └───────┬────────┘
                                                                  │
                                                          ┌───────▼────────┐
                                                          │  Stock         │
                                                          │  Service       │
                                                          └───────┬────────┘
                                                                  │
                                                          ┌───────▼────────┐
                                                          │  Stock         │
                                                          │  Repository    │
                                                          └───────┬────────┘
                                                                  │
                                             ┌────────────────────┼──────────┐
                                             │                    │          │
                                      ┌──────▼──────┐    ┌────────▼───────┐ │
                                      │  Database   │    │  File System   │ │
                                      │  (Cached)   │    │  Stock Reader  │ │
                                      └─────────────┘    └────────┬───────┘ │
                                                                  │          │
                                                          ┌───────▼────────┐ │
                                                          │  CSV Parser    │ │
                                                          └───────┬────────┘ │
                                                                  │          │
                                                          ┌───────▼────────┐ │
                                                          │  .ind Files    │ │
                                                          └────────────────┘ │
                                                                             │
     ┌───────────────────────────────────────────────────────────────────────┘
     │ Data returned through layers
     │
┌────▼──────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│           │     │             │     │              │     │            │
│  Stock    │◀────│  Redux      │◀────│  Response    │◀────│  API       │
│  Data     │     │  State      │     │  (DTO)       │     │  Controller│
│  Display  │     │             │     │              │     │            │
└───────────┘     └─────────────┘     └──────────────┘     └────────────┘
```

### 4.2 Order Execution Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Place   │     │   Order     │     │   Redux      │     │   API      │
│  Order   │────▶│   Panel     │────▶│   Action     │────▶│  Service   │
│  Button  │     │ Component   │     │              │     │            │
└──────────┘     └─────────────┘     └──────────────┘     └─────┬──────┘
                                                                  │
                                                                  │ POST
                                                                  │
                                                          ┌───────▼────────┐
                                                          │  Trading       │
                                                          │  Controller    │
                                                          └───────┬────────┘
                                                                  │
                                                          ┌───────▼────────┐
                                                          │  Trading       │
                                                          │  Service       │
                                                          └───────┬────────┘
                                                                  │
                                                    ┌─────────────┼──────────┐
                                                    │             │          │
                                            ┌───────▼───────┐ ┌──▼────────┐ │
                                            │ Order Domain  │ │ Position  │ │
                                            │ Validation    │ │Repository │ │
                                            └───────┬───────┘ └──┬────────┘ │
                                                    │             │          │
                                            ┌───────▼─────────────▼────────┐ │
                                            │ IOrderExecutionService       │ │
                                            │ (Domain Service)             │ │
                                            └───────┬──────────────────────┘ │
                                                    │                        │
                                            ┌───────▼────────┐               │
                                            │ Order          │               │
                                            │ Repository     │               │
                                            └───────┬────────┘               │
                                                    │                        │
                                            ┌───────▼────────┐               │
                                            │   Database     │               │
                                            │   Transaction  │               │
                                            └───────┬────────┘               │
                                                    │                        │
                                            ┌───────▼────────┐               │
                                            │   SignalR Hub  │               │
                                            │   Notification │               │
                                            └───────┬────────┘               │
     ┌──────────────────────────────────────────────┼────────────────────────┘
     │                                              │
     │ WebSocket Push                               │
     │                                              │
┌────▼──────────┐   ┌─────────────┐   ┌────────────▼────┐   ┌─────────────┐
│   SignalR     │   │   Redux     │   │   HTTP          │   │   API       │
│   Service     │──▶│   Action    │   │   Response      │◀──│  Controller │
│ (Frontend)    │   │             │   │                 │   │             │
└───────┬───────┘   └──────┬──────┘   └─────────────────┘   └─────────────┘
        │                  │
        │                  │
┌───────▼──────────────────▼────┐
│   Redux State Update          │
│   - orders list               │
│   - positions list            │
│   - account balance           │
└───────┬───────────────────────┘
        │
┌───────▼───────────────────────┐
│   UI Components Re-render     │
│   - Order List                │
│   - Position List             │
│   - Account Summary           │
│   - Chart (position markers)  │
└───────────────────────────────┘
```

### 4.3 Real-Time Chart Update Flow

```
┌──────────────┐
│  Backend     │
│  Price       │
│  Update      │
│  Event       │
└──────┬───────┘
       │
       │
┌──────▼────────┐
│  SignalR Hub  │
│  Broadcasting │
└──────┬────────┘
       │
       │ WebSocket
       │
┌──────▼─────────────┐
│  SignalR Service   │
│  (Frontend)        │
└──────┬─────────────┘
       │
       │
┌──────▼─────────────┐
│  Redux Dispatch    │
│  UPDATE_CHART      │
└──────┬─────────────┘
       │
       │
┌──────▼─────────────┐
│  Chart Slice       │
│  State Update      │
└──────┬─────────────┘
       │
       │
┌──────▼─────────────┐
│  Chart Component   │
│  Re-render         │
└──────┬─────────────┘
       │
       │
┌──────▼─────────────┐
│  react-financial   │
│  -charts           │
│  Update            │
└────────────────────┘
```

## 5. Repository Pattern Implementation

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Domain Layer                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │               IRepository<T> Interface                        │  │
│  │  - Task<T> GetByIdAsync(id)                                  │  │
│  │  - Task<IEnumerable<T>> GetAllAsync()                        │  │
│  │  - Task<T> AddAsync(entity)                                  │  │
│  │  - Task UpdateAsync(entity)                                  │  │
│  │  - Task DeleteAsync(id)                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │          Specific Repository Interfaces                       │  │
│  │  IStockRepository : IRepository<Stock>                       │  │
│  │  IPositionRepository : IRepository<Position>                 │  │
│  │  IOrderRepository : IRepository<Order>                       │  │
│  │  ITraderAccountRepository : IRepository<TraderAccount>       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │ implemented by
┌─────────────────────────────▼───────────────────────────────────────┐
│                    Infrastructure Layer                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │          Repository<T> Base Class                             │  │
│  │  - DbContext context                                         │  │
│  │  - DbSet<T> dbSet                                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │     Specific Repository Implementations                       │  │
│  │  StockRepository                                             │  │
│  │  PositionRepository                                          │  │
│  │  OrderRepository                                             │  │
│  │  TraderAccountRepository                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │          TradingStationDbContext                              │  │
│  │  - DbSet<Stock> Stocks                                       │  │
│  │  - DbSet<Position> Positions                                 │  │
│  │  - DbSet<Order> Orders                                       │  │
│  │  - DbSet<TraderAccount> TraderAccounts                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 6. Dependency Injection Container Configuration

```
Program.cs / Startup.cs
│
├─ Domain Layer (No registration needed - no dependencies)
│
├─ Application Layer
│  ├─ services.AddScoped<IStockService, StockService>()
│  ├─ services.AddScoped<ITradingService, TradingService>()
│  ├─ services.AddScoped<IBacktestService, BacktestService>()
│  ├─ services.AddScoped<IAccountService, AccountService>()
│  └─ services.AddAutoMapper(Assembly)
│
├─ Infrastructure Layer
│  ├─ services.AddDbContext<TradingStationDbContext>()
│  ├─ services.AddScoped<IStockRepository, StockRepository>()
│  ├─ services.AddScoped<IPositionRepository, PositionRepository>()
│  ├─ services.AddScoped<IOrderRepository, OrderRepository>()
│  ├─ services.AddScoped<ITraderAccountRepository, TraderAccountRepository>()
│  ├─ services.AddScoped<IStockFileReader, StockFileReader>()
│  └─ services.AddMemoryCache()
│
├─ API Layer
│  ├─ services.AddControllers()
│  ├─ services.AddSignalR()
│  ├─ services.AddCors()
│  └─ services.AddSwaggerGen()
│
└─ Cross-Cutting Concerns
   ├─ services.AddLogging() → Serilog
   └─ services.AddFluentValidation()
```

This comprehensive component diagram documentation provides a complete view of the Trading Station system architecture, showing how all components interact and depend on each other across all layers.
