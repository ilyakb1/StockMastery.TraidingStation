# Trading Station - Full Technical Specification

## Executive Summary

Trading Station is a historical trading platform designed to test trading strategies on historical stock market data. The platform enables users to simulate trading operations, visualize stock performance with technical indicators, and analyze strategy effectiveness through backtesting.

## 1. Business Requirements

### 1.1 Purpose
Enable traders and analysts to:
- Test trading strategies against historical market data
- Simulate realistic trading scenarios with buy/sell orders
- Analyze stock performance with technical indicators
- Evaluate strategy effectiveness across different timeframes
- Manage virtual trading accounts with risk management features

### 1.2 Core Functionality
1. **Historical Data Visualization**
   - Display stock candlestick charts with volume data
   - Overlay technical indicators (MACD, SMA, RSI, Volume MA)
   - Support multiple stocks and markets

2. **Trading Simulation**
   - Create virtual trader accounts
   - Execute buy, sell, and close orders
   - Implement stop-loss mechanisms (price-based and time-based)
   - Track position history and P&L

3. **Strategy Testing**
   - Define predictive timeframes
   - Run strategies across stock portfolios
   - Compare predicted vs actual outcomes
   - Generate performance metrics

4. **Market Selection**
   - Choose from available markets (AU, US, etc.)
   - Select stock sets for batch testing
   - Filter and search capabilities

## 2. User Interface Requirements

### 2.1 Layout Structure
The application consists of two main tabs:

#### Tab 1: Strategy Configuration
- **Timeframe Selection**
  - Known timeframe selector (historical data range)
  - Prediction timeframe selector (forecast period)
  - Day-based prediction input

- **Market & Stock Selection**
  - Market dropdown (AU, US, etc.)
  - Stock multi-select with search/filter
  - Saved stock sets management

- **Account Management**
  - Initial capital input
  - Risk parameters configuration
  - Account summary display

#### Tab 2: Trading Visualization
- **Chart Area (Primary)**
  - Candlestick chart with volume bars
  - Technical indicators overlay
  - Position markers (entry/exit points)
  - Interactive zoom and pan

- **Order Management Panel**
  - Active positions list
  - Order history
  - Buy/Sell controls
  - Stop-loss configuration

- **Performance Metrics**
  - Current P&L
  - Win/Loss ratio
  - Total trades executed
  - Account balance

### 2.2 User Interactions
- Real-time chart updates via SignalR
- Drag-to-zoom on charts
- Click-to-select stocks
- Form-based order entry
- Keyboard shortcuts for common actions

## 3. Functional Requirements

### 3.1 Data Management
**FR-1: Stock Data Loading**
- Load stock data from CSV files in `C:\repos\StockMastery\Data` directory
- Support hierarchical structure: `Market/Symbol/Symbol.ind`
- Parse OHLCV data with technical indicators
- Handle timezone information

**FR-2: Indicator Support**
- MACD (Moving Average Convergence Divergence)
- MACD Signal and Histogram
- SMA 200 (Simple Moving Average)
- SMA 50
- Volume MA 20
- RSI 14 (Relative Strength Index)

**FR-3: Data Validation**
- Validate CSV format and data integrity
- Handle missing indicator values
- Detect and report corrupted data files

### 3.2 Trading Engine
**FR-4: Account Management**
- Create trader accounts with initial capital
- Track available cash and invested capital
- Maintain transaction history
- Calculate unrealized and realized P&L

**FR-5: Order Execution**
- Market orders (buy/sell at current price)
- Position tracking (entry price, quantity, current value)
- Commission calculation (configurable)
- Slippage simulation (optional)

**FR-6: Stop-Loss Mechanisms**
- Price-based stop-loss (exit when price drops below threshold)
- Time-based stop-loss (exit after N days)
- Trailing stop-loss (optional enhancement)

**FR-7: Position Management**
- Open positions tracking
- Closed positions history
- Average entry price calculation
- Position sizing rules

### 3.3 Strategy Backtesting
**FR-8: Strategy Execution**
- Define entry/exit rules
- Run strategies across selected stocks
- Apply strategies to historical timeframes
- Generate trade signals

**FR-9: Performance Metrics**
- Total return (absolute and percentage)
- Win rate (winning trades / total trades)
- Average win/loss size
- Maximum drawdown
- Sharpe ratio (optional)

### 3.4 Visualization
**FR-10: Chart Rendering**
- Candlestick chart with OHLC data
- Volume bars synchronized with price
- Technical indicator overlays
- Responsive scaling and panning

**FR-11: Position Markers**
- Buy position markers (green arrow up)
- Sell position markers (red arrow down)
- Hover tooltips with trade details
- Highlight active positions

**FR-12: Real-time Updates**
- Push notifications for order executions
- Live chart updates via SignalR
- Account balance updates
- New stock data availability

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1:** Chart rendering must handle 5000+ candlesticks smoothly (60 FPS)
- **NFR-2:** Stock data loading must complete within 2 seconds for files up to 10MB
- **NFR-3:** API responses must return within 500ms for data queries
- **NFR-4:** Support concurrent sessions for up to 100 users

### 4.2 Scalability
- **NFR-5:** Architecture must support adding new markets without code changes
- **NFR-6:** Indicator system must be extensible for custom indicators
- **NFR-7:** Database must handle 1M+ historical data points

### 4.3 Reliability
- **NFR-8:** System uptime of 99.5%
- **NFR-9:** Graceful error handling with user-friendly messages
- **NFR-10:** Data persistence for all trades and account states

### 4.4 Security
- **NFR-11:** Input validation on all API endpoints
- **NFR-12:** SQL injection prevention (parameterized queries)
- **NFR-13:** XSS prevention on frontend
- **NFR-14:** CORS policy configuration

### 4.5 Usability
- **NFR-15:** Responsive design for desktop (1920x1080 minimum)
- **NFR-16:** Intuitive navigation with max 3 clicks to any feature
- **NFR-17:** Comprehensive error messages with resolution guidance

### 4.6 Maintainability
- **NFR-18:** Clean code principles (SOLID, DRY, KISS)
- **NFR-19:** Minimum 80% unit test coverage
- **NFR-20:** Comprehensive API documentation
- **NFR-21:** Code review process with documented standards

## 5. Data Model

### 5.1 Entities

#### Stock
```
- Symbol (string, PK)
- Market (string)
- Name (string)
- Sector (string, optional)
- LastUpdated (DateTime)
```

#### StockPrice
```
- Id (int, PK)
- Symbol (string, FK)
- Date (DateTime)
- Open (decimal)
- High (decimal)
- Low (decimal)
- Close (decimal)
- AdjustedClose (decimal)
- Volume (long)
```

#### Indicator
```
- Id (int, PK)
- StockPriceId (int, FK)
- Macd (decimal?)
- MacdSignal (decimal?)
- MacdHistogram (decimal?)
- Sma200 (decimal?)
- Sma50 (decimal?)
- VolMA20 (decimal?)
- Rsi14 (decimal?)
```

#### TraderAccount
```
- Id (int, PK)
- Name (string)
- InitialCapital (decimal)
- CurrentCash (decimal)
- CreatedDate (DateTime)
- IsActive (bool)
```

#### Position
```
- Id (int, PK)
- AccountId (int, FK)
- Symbol (string, FK)
- EntryDate (DateTime)
- EntryPrice (decimal)
- Quantity (int)
- StopLossPrice (decimal?)
- StopLossDays (int?)
- Status (enum: Open, Closed)
- ExitDate (DateTime?)
- ExitPrice (decimal?)
- RealizedPL (decimal?)
```

#### Order
```
- Id (int, PK)
- AccountId (int, FK)
- Symbol (string, FK)
- OrderType (enum: Buy, Sell)
- Quantity (int)
- Price (decimal)
- OrderDate (DateTime)
- Status (enum: Pending, Executed, Cancelled)
```

### 5.2 Relationships
- Stock 1:N StockPrice
- StockPrice 1:1 Indicator
- TraderAccount 1:N Position
- TraderAccount 1:N Order
- Stock 1:N Position
- Stock 1:N Order

## 6. API Endpoints

### 6.1 Stock Data
```
GET /api/stocks - List all available stocks
GET /api/stocks/{symbol} - Get stock details
GET /api/stocks/{symbol}/prices?from={date}&to={date} - Get historical prices
GET /api/markets - List available markets
GET /api/markets/{market}/stocks - Get stocks for market
```

### 6.2 Trading
```
POST /api/accounts - Create trader account
GET /api/accounts/{id} - Get account details
POST /api/orders - Place order
GET /api/orders/{id} - Get order status
GET /api/positions?accountId={id}&status={open|closed} - Get positions
PUT /api/positions/{id}/close - Close position
PUT /api/positions/{id}/stoploss - Update stop-loss
```

### 6.3 Strategy
```
POST /api/strategies - Create/save strategy
GET /api/strategies/{id}/backtest - Run backtest
GET /api/strategies/{id}/results - Get backtest results
```

### 6.4 SignalR Hubs
```
/hubs/trading - Trading notifications hub
  - OnOrderExecuted
  - OnPositionClosed
  - OnStopLossTriggered
  - OnAccountUpdate
```

## 7. File Structure Data Format

### 7.1 Stock Data Files
**Location:** `C:\repos\StockMastery\Data\{Market}\{Symbol}\{Symbol}.ind`

**Format:** CSV with headers
```csv
"Date","Open","High","Low","Close","AdjustedClose","Volume","Macd","MacdSignal","MacdHistogram","Sma200","Sma50","VolMA20","Rsi14"
"11/22/2024 00:00:00 +11:00","0.12","0.12","0.12","0.12","0.12","4729","","","","","","",""
```

**Field Specifications:**
- Date: ISO 8601 format with timezone
- OHLC: Decimal values
- Volume: Integer
- Indicators: Nullable decimals (empty string for null)

## 8. Technology Constraints

### 8.1 Frontend
- React (functional components)
- Redux for state management
- react-financial-charts for charting
- Jest for unit testing
- TypeScript (recommended)

### 8.2 Backend
- C# .NET 6/7/8
- ASP.NET Core Web API
- SignalR for real-time communication
- Onion Architecture pattern
- Entity Framework Core (ORM)

### 8.3 Development Practices
- Clean Code principles
- SOLID design principles
- Unit testing with >80% coverage
- Code reviews
- Git version control

## 9. Success Criteria

### 9.1 Functional Success
- Successfully load and display stock data from file system
- Execute buy/sell orders with accurate P&L calculation
- Render charts with indicators smoothly
- Support backtesting across multiple stocks
- Real-time updates via SignalR working

### 9.2 Quality Success
- All unit tests passing
- No critical bugs in production
- Code review approval on all PRs
- API documentation complete
- User acceptance testing passed

## 10. Future Enhancements (Out of Scope)

- Live market data integration
- Advanced order types (limit, stop-limit)
- Portfolio optimization algorithms
- Machine learning strategy generation
- Mobile application
- Multi-user collaboration features
- Social trading features
- Export to Excel/PDF reports
