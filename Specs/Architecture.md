# Trading Station - Architecture Document

## 1. Architecture Overview

### 1.1 Architectural Pattern
The system follows **Onion Architecture** (also known as Clean Architecture) for the backend, which provides:
- Clear separation of concerns
- Dependency inversion
- Testability
- Technology independence at the core

### 1.2 High-Level Architecture (Updated with Trading Engine)

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌──────────────────────┐      ┌──────────────────────────┐ │
│  │   React Frontend     │◄────►│  ASP.NET Core Web API    │ │
│  │  (User Interface)    │      │   (REST + SignalR)       │ │
│  └──────────────────────┘      └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Application Services (Use Cases)                    │   │
│  │  - BacktestService, LiveTradingService, StockService │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                    │                              │
        ┌───────────┴──────────┐        ┌──────────┴──────────┐
        ▼                      ▼        ▼                     ▼
┌─────────────────┐  ┌─────────────────────────────────────────┐
│  Backtesting    │  │     Trading Engine (Reusable DLL)       │
│  Engine         │  │  ┌──────────────────────────────────┐   │
│  - BacktestRunner  │  │  - OrderExecutionEngine          │   │
│  - Strategy        │  │  - PositionManager               │   │
│    Interface       │  │  - RiskManager                   │   │
└────────┬────────┘  │  │  - AccountManager                │   │
         │           │  └──────────────────────────────────┘   │
         │           └─────────────────────────────────────────┘
         │                      │
         └──────────────────────┤
                                │ Uses
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Contracts Layer (Interfaces)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  - IMarketDataProvider                               │   │
│  │  - IIndicatorProvider                                │   │
│  │  - IOrderExecutionService                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                                           │
         │ Implemented by                            │ Implemented by
         ▼                                           ▼
┌─────────────────────┐                   ┌─────────────────────┐
│ Data.Backtesting    │                   │   Data.Live         │
│ ┌─────────────────┐ │                   │ ┌─────────────────┐ │
│ │  Backtesting    │ │                   │ │  Live Market    │ │
│ │  MarketData     │ │                   │ │  Data Provider  │ │
│ │  Provider       │ │                   │ │                 │ │
│ │  (Time-Safe)    │ │                   │ └─────────────────┘ │
│ └─────────────────┘ │                   └─────────────────────┘
└─────────────────────┘
         │
         │ Enforces temporal constraints
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │  Data Access     │  │  File System     │  │  SignalR  │ │
│  │  (EF Core)       │  │  Stock Reader    │  │  Hubs     │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  SQL Server Database │
                        │  File System (Data)  │
                        └──────────────────────┘
```

**Key Changes:**
1. **Trading Engine** extracted as reusable DLL
2. **Contracts Layer** defines data provider interfaces
3. **Backtesting Data Layer** enforces temporal constraints (no future data)
4. **Live Data Layer** for production trading
5. Same trading logic works in both environments

## 2. Onion Architecture Layers

### 2.1 Domain Layer (Core)
**Location:** `TradingStation.Domain`

**Responsibility:** Contains business logic and domain models

**Components:**
- **Entities:**
  - `Stock` - Stock information and metadata
  - `StockPrice` - OHLCV price data
  - `Indicator` - Technical indicator values
  - `TraderAccount` - Trading account with capital management
  - `Position` - Open/closed trading positions
  - `Order` - Buy/sell orders
  - `Strategy` - Trading strategy definitions

- **Value Objects:**
  - `Money` - Currency amount with validation
  - `StopLoss` - Stop-loss configuration
  - `TimeFrame` - Date range representation
  - `Symbol` - Stock symbol validation

- **Domain Services:**
  - `IOrderExecutionService` - Order execution logic
  - `IProfitLossCalculator` - P&L calculations
  - `IStopLossEvaluator` - Stop-loss trigger logic

- **Repository Interfaces:**
  - `IStockRepository`
  - `ITraderAccountRepository`
  - `IPositionRepository`
  - `IOrderRepository`

**Dependencies:** None (pure business logic)

### 2.2 Application Layer
**Location:** `TradingStation.Application`

**Responsibility:** Orchestrates domain logic and use cases

**Components:**
- **Application Services:**
  - `StockService` - Stock data retrieval and management
  - `TradingService` - Order placement and execution
  - `PositionService` - Position management
  - `BacktestService` - Strategy backtesting
  - `AccountService` - Account operations

- **DTOs (Data Transfer Objects):**
  - `StockDto`, `StockPriceDto`
  - `OrderDto`, `PositionDto`
  - `BacktestResultDto`
  - `AccountSummaryDto`

- **Commands & Queries (CQRS pattern):**
  - Commands: `CreateOrderCommand`, `ClosePositionCommand`
  - Queries: `GetStockPricesQuery`, `GetAccountPositionsQuery`

- **Validators:**
  - FluentValidation for input validation
  - Business rule validation

**Dependencies:** Domain Layer

### 2.3 Infrastructure Layer
**Location:** `TradingStation.Infrastructure`

**Responsibility:** External concerns (data access, file I/O, external services)

**Components:**
- **Data Access:**
  - `TradingStationDbContext` - EF Core DbContext
  - `StockRepository` - Stock data repository implementation
  - `TraderAccountRepository` - Account repository
  - `PositionRepository` - Position repository
  - `OrderRepository` - Order repository

- **File System Access:**
  - `StockFileReader` - Read .ind files
  - `CsvParser` - Parse CSV data
  - `FileSystemStockProvider` - Discover available stocks

- **SignalR Hubs:**
  - `TradingHub` - Real-time trading notifications
  - `ChartHub` - Chart update notifications (optional)

- **External Services:**
  - Logging (Serilog)
  - Caching (IMemoryCache)

**Dependencies:** Domain Layer, Application Layer

### 2.4 API Layer (Presentation)
**Location:** `TradingStation.API`

**Responsibility:** HTTP endpoints and request/response handling

**Components:**
- **Controllers:**
  - `StocksController` - Stock data endpoints
  - `TradingController` - Trading operations
  - `AccountsController` - Account management
  - `BacktestController` - Backtesting endpoints

- **SignalR Hubs:**
  - Hub registration and configuration

- **Middleware:**
  - Exception handling middleware
  - Request logging
  - CORS configuration

- **Configuration:**
  - Dependency injection setup
  - Swagger/OpenAPI configuration
  - Authentication/Authorization (if needed)

**Dependencies:** Application Layer, Infrastructure Layer

### 2.5 Frontend (React)
**Location:** `TradingStation.Web` (separate React app)

**Responsibility:** User interface and state management

**Structure:**
```
src/
├── components/
│   ├── charts/
│   │   ├── CandlestickChart.tsx
│   │   ├── VolumeChart.tsx
│   │   └── IndicatorOverlay.tsx
│   ├── trading/
│   │   ├── OrderPanel.tsx
│   │   ├── PositionList.tsx
│   │   └── AccountSummary.tsx
│   ├── stocks/
│   │   ├── StockSelector.tsx
│   │   └── MarketSelector.tsx
│   └── common/
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── store/
│   ├── slices/
│   │   ├── stocksSlice.ts
│   │   ├── tradingSlice.ts
│   │   ├── accountSlice.ts
│   │   └── chartSlice.ts
│   ├── actions/
│   ├── reducers/
│   └── store.ts
├── services/
│   ├── api/
│   │   ├── stockApi.ts
│   │   ├── tradingApi.ts
│   │   └── accountApi.ts
│   └── signalr/
│       └── tradingHubService.ts
├── hooks/
│   ├── useStockData.ts
│   ├── useTradingHub.ts
│   └── useOrders.ts
├── models/
│   ├── Stock.ts
│   ├── Order.ts
│   └── Position.ts
└── utils/
    ├── chartHelpers.ts
    └── formatters.ts
```

## 3. Design Patterns

### 3.1 Backend Patterns

**Repository Pattern**
- Abstracts data access logic
- Interface: `IRepository<T>`
- Implementations in Infrastructure layer

**Unit of Work Pattern**
- Manages transactions across repositories
- `IUnitOfWork` interface
- Implemented in `TradingStationDbContext`

**CQRS (Command Query Responsibility Segregation)**
- Separates read and write operations
- Commands modify state
- Queries return data

**Dependency Injection**
- All dependencies injected via constructor
- Configured in `Program.cs`
- Interfaces resolved at runtime

**Specification Pattern**
- Complex query logic encapsulation
- `ISpecification<T>` interface
- Used for filtering stocks, positions

**Factory Pattern**
- `OrderFactory` - Create orders based on type
- `IndicatorFactory` - Create indicator calculators

**Strategy Pattern**
- `IStopLossStrategy` - Different stop-loss implementations
- `IBacktestStrategy` - Different backtesting strategies

### 3.2 Frontend Patterns

**Redux Pattern**
- Centralized state management
- Actions → Reducers → State
- Immutable state updates

**Component Composition**
- Reusable presentational components
- Container components for logic

**Custom Hooks**
- Encapsulate reusable logic
- `useStockData`, `useTradingHub`

**Error Boundary**
- Catch and handle React errors gracefully

**HOC (Higher-Order Components)**
- `withAuth`, `withLoading` (if needed)

## 4. Data Flow

### 4.1 Stock Data Loading Flow
```
User Request
    ↓
React Component → Redux Action
    ↓
API Call (stockApi.ts)
    ↓
StocksController
    ↓
StockService (Application)
    ↓
IStockRepository (Domain Interface)
    ↓
StockFileReader (Infrastructure) → File System
    ↓
Parse CSV → Domain Entities
    ↓
Return DTOs ← ← ← ← ←
    ↓
Redux State Update
    ↓
Component Re-render
```

### 4.2 Order Execution Flow
```
User Action (Place Order)
    ↓
OrderPanel Component → Redux Action
    ↓
API Call (tradingApi.ts)
    ↓
TradingController
    ↓
TradingService.PlaceOrder()
    ↓
Domain Validation
    ↓
IOrderExecutionService (Domain)
    ↓
Create Order Entity
    ↓
IOrderRepository.Add()
    ↓
Database Persistence
    ↓
SignalR Hub Notification
    ↓
Frontend receives push → Update Redux State
    ↓
UI Update (Order List, Account Balance)
```

### 4.3 Real-Time Updates Flow
```
Backend Event (Order Executed)
    ↓
TradingHub.SendOrderExecuted()
    ↓
SignalR Connection
    ↓
tradingHubService.ts (Frontend)
    ↓
Dispatch Redux Action
    ↓
Update State
    ↓
Component Re-render
    ↓
User sees notification
```

## 5. Database Design

### 5.1 Schema
```sql
-- Stocks table
CREATE TABLE Stocks (
    Symbol VARCHAR(10) PRIMARY KEY,
    Market VARCHAR(10) NOT NULL,
    Name VARCHAR(100),
    Sector VARCHAR(50),
    LastUpdated DATETIME2 NOT NULL,
    INDEX IX_Stocks_Market (Market)
);

-- StockPrices table
CREATE TABLE StockPrices (
    Id INT PRIMARY KEY IDENTITY,
    Symbol VARCHAR(10) NOT NULL,
    Date DATETIME2 NOT NULL,
    Open DECIMAL(18,4) NOT NULL,
    High DECIMAL(18,4) NOT NULL,
    Low DECIMAL(18,4) NOT NULL,
    Close DECIMAL(18,4) NOT NULL,
    AdjustedClose DECIMAL(18,4) NOT NULL,
    Volume BIGINT NOT NULL,
    FOREIGN KEY (Symbol) REFERENCES Stocks(Symbol),
    INDEX IX_StockPrices_Symbol_Date (Symbol, Date),
    UNIQUE (Symbol, Date)
);

-- Indicators table
CREATE TABLE Indicators (
    Id INT PRIMARY KEY IDENTITY,
    StockPriceId INT NOT NULL,
    Macd DECIMAL(18,8),
    MacdSignal DECIMAL(18,8),
    MacdHistogram DECIMAL(18,8),
    Sma200 DECIMAL(18,4),
    Sma50 DECIMAL(18,4),
    VolMA20 DECIMAL(18,2),
    Rsi14 DECIMAL(18,4),
    FOREIGN KEY (StockPriceId) REFERENCES StockPrices(Id) ON DELETE CASCADE,
    INDEX IX_Indicators_StockPriceId (StockPriceId)
);

-- TraderAccounts table
CREATE TABLE TraderAccounts (
    Id INT PRIMARY KEY IDENTITY,
    Name VARCHAR(100) NOT NULL,
    InitialCapital DECIMAL(18,2) NOT NULL,
    CurrentCash DECIMAL(18,2) NOT NULL,
    CreatedDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    IsActive BIT NOT NULL DEFAULT 1
);

-- Positions table
CREATE TABLE Positions (
    Id INT PRIMARY KEY IDENTITY,
    AccountId INT NOT NULL,
    Symbol VARCHAR(10) NOT NULL,
    EntryDate DATETIME2 NOT NULL,
    EntryPrice DECIMAL(18,4) NOT NULL,
    Quantity INT NOT NULL,
    StopLossPrice DECIMAL(18,4),
    StopLossDays INT,
    Status VARCHAR(10) NOT NULL, -- Open, Closed
    ExitDate DATETIME2,
    ExitPrice DECIMAL(18,4),
    RealizedPL DECIMAL(18,2),
    FOREIGN KEY (AccountId) REFERENCES TraderAccounts(Id),
    FOREIGN KEY (Symbol) REFERENCES Stocks(Symbol),
    INDEX IX_Positions_AccountId_Status (AccountId, Status)
);

-- Orders table
CREATE TABLE Orders (
    Id INT PRIMARY KEY IDENTITY,
    AccountId INT NOT NULL,
    Symbol VARCHAR(10) NOT NULL,
    OrderType VARCHAR(10) NOT NULL, -- Buy, Sell
    Quantity INT NOT NULL,
    Price DECIMAL(18,4) NOT NULL,
    OrderDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    Status VARCHAR(20) NOT NULL, -- Pending, Executed, Cancelled
    FOREIGN KEY (AccountId) REFERENCES TraderAccounts(Id),
    FOREIGN KEY (Symbol) REFERENCES Stocks(Symbol),
    INDEX IX_Orders_AccountId_Status (AccountId, Status)
);
```

### 5.2 Indexing Strategy
- Primary keys: Clustered indexes
- Foreign keys: Non-clustered indexes
- Frequently queried columns: Composite indexes
- Symbol + Date: Unique index for fast lookups

## 6. Security Architecture

### 6.1 API Security
- HTTPS only in production
- CORS configuration for frontend domain
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)

### 6.2 Data Protection
- XSS prevention in React (automatic escaping)
- CSRF tokens (if using cookies)
- Sanitize file paths when reading stock data

### 6.3 Error Handling
- Global exception handler middleware
- User-friendly error messages (no stack traces in production)
- Logging of all errors with context

## 7. Deployment Architecture

### 7.1 Development Environment
```
Developer Workstation
├── React Dev Server (port 3000)
├── .NET API (port 5000/5001)
└── SQL Server LocalDB
```

### 7.2 Production Environment (Proposed)
```
Load Balancer
    ↓
┌─────────────────┐
│  Web Server     │
│  (React SPA)    │
│  IIS/Nginx      │
└─────────────────┘
    ↓
┌─────────────────┐
│  API Server     │
│  ASP.NET Core   │
│  IIS/Kestrel    │
└─────────────────┘
    ↓
┌─────────────────┐
│  SQL Server     │
│  (Database)     │
└─────────────────┘
    ↓
┌─────────────────┐
│  File Storage   │
│  (Stock Data)   │
└─────────────────┘
```

## 8. Scalability Considerations

### 8.1 Horizontal Scaling
- Stateless API servers (can add more instances)
- SignalR backplane (Redis/SQL Server) for multi-server scenarios
- Load balancing with sticky sessions for SignalR

### 8.2 Caching Strategy
- In-memory cache for frequently accessed stocks
- Cache invalidation on data updates
- Redis for distributed caching (future)

### 8.3 Database Optimization
- Read replicas for heavy read operations
- Partitioning large tables by date
- Archive old stock data

## 9. Monitoring & Logging

### 9.1 Application Logging
- Serilog with structured logging
- Log levels: Debug, Information, Warning, Error, Critical
- Log sinks: File, Console, SQL Server

### 9.2 Performance Monitoring
- Application Insights (Azure) or similar
- API response time tracking
- Database query performance

### 9.3 Health Checks
- `/health` endpoint for API health
- Database connectivity check
- File system accessibility check

## 10. Testing Strategy

### 10.1 Unit Tests
- Domain logic tests (pure business logic)
- Service layer tests (mocked dependencies)
- Repository tests (in-memory database)
- Jest tests for React components

### 10.2 Integration Tests
- API endpoint tests
- Database integration tests
- SignalR hub tests

### 10.3 End-to-End Tests
- Selenium/Playwright for UI testing
- Critical user flows (place order, view chart)

## 11. Build & Deployment Pipeline

### 11.1 CI/CD Pipeline
```
Git Push
    ↓
GitHub Actions / Azure DevOps
    ↓
┌─────────────────────────────────┐
│  Build Stage                    │
│  - Restore packages             │
│  - Build .NET solution          │
│  - Build React app              │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  Test Stage                     │
│  - Run unit tests               │
│  - Run integration tests        │
│  - Code coverage report         │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  Publish Stage                  │
│  - Create deployment artifacts  │
│  - Docker image build (optional)│
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  Deploy Stage                   │
│  - Deploy to staging            │
│  - Smoke tests                  │
│  - Deploy to production         │
└─────────────────────────────────┘
```

## 12. Technology Stack Summary

**Frontend:**
- React 18+
- Redux Toolkit
- TypeScript
- react-financial-charts
- Axios (HTTP client)
- @microsoft/signalr

**Backend:**
- .NET 8
- ASP.NET Core Web API
- Entity Framework Core 8
- SignalR
- Serilog

**Database:**
- SQL Server 2019+

**Testing:**
- xUnit / NUnit (.NET)
- Jest (React)
- FluentAssertions
- Moq

**DevOps:**
- Git
- GitHub Actions / Azure DevOps
- Docker (optional)
