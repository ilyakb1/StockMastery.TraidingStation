# Trading Station UI

React-based user interface for the Trading Station backtesting platform.

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Trading Station API running on https://localhost:5001

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The UI will be available at http://localhost:3000

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Features

### Dashboard
- Overview of all trading accounts
- Statistics: total accounts, capital, equity, and available stocks
- Account list with P&L calculations

### Run Backtest
- Select trading account
- Configure date range
- Select symbols to trade
- Configure Moving Average Crossover strategy parameters
- Execute backtest with temporal safety

### Backtest Results
- Performance metrics (total return, Sharpe ratio, max drawdown, win rate)
- Trade statistics (total trades, average win/loss, profit factor)
- Equity curve chart
- Monthly returns chart
- Complete trade history table

### Accounts
- View all trading accounts
- Create new accounts with initial capital
- Monitor account status and performance

## API Integration

The UI connects to the Trading Station API via a proxy configured in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'https://localhost:5001',
    changeOrigin: true,
    secure: false
  }
}
```

All API calls are made through the `src/services/api.ts` service layer.

## Testing

### End-to-End Tests

Comprehensive E2E tests using Playwright covering all user workflows.

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:report
```

**Test Coverage:**
- 94 test cases across 5 test suites
- Dashboard, Accounts, Backtest, Results, Integration tests
- Complete user workflow validation
- Specification compliance

See [e2e/README.md](e2e/README.md) for detailed testing documentation.

## Project Structure

```
ui/
├── src/
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Backtest.tsx
│   │   ├── BacktestResults.tsx
│   │   └── Accounts.tsx
│   ├── services/        # API service layer
│   │   └── api.ts
│   ├── App.tsx          # Main app with routing
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── e2e/                 # End-to-end tests
│   ├── fixtures.ts      # Test helpers and mock data
│   ├── dashboard.spec.ts
│   ├── accounts.spec.ts
│   ├── backtest.spec.ts
│   ├── results.spec.ts
│   └── integration.spec.ts
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies
├── playwright.config.ts # Playwright config
├── tsconfig.json        # TypeScript config
├── tailwind.config.js   # Tailwind config
└── vite.config.ts       # Vite config
```

## Notes

- The UI uses sessionStorage to pass backtest results from the form to the results page
- All dates are displayed in the user's local timezone
- The API proxy is configured for development only; production deployments should configure CORS properly
