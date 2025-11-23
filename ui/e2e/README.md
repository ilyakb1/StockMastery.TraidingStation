# Trading Station E2E Tests

Comprehensive end-to-end tests for the Trading Station backtesting platform using Playwright.

## Overview

These tests validate the complete user workflows and feature implementations based on the specifications in [CLAUDE.md](../../CLAUDE.md). The tests ensure that all critical functionality works as expected from a user's perspective.

## Test Coverage

### 1. Dashboard Tests ([dashboard.spec.ts](dashboard.spec.ts))

Tests for the main dashboard overview page:

- **Display Elements**
  - Page title and description
  - Statistics cards (Total Accounts, Total Capital, Total Equity, Available Stocks)
  - Accounts table with all columns

- **Data Presentation**
  - Account data in table rows
  - P&L calculations (absolute and percentage)
  - Color coding (green for positive, red for negative)
  - Date formatting
  - Active/Inactive status badges

- **User Interactions**
  - Navigation to other pages
  - Empty state when no accounts exist
  - Loading states

- **Responsive Design**
  - Grid layout for statistics
  - Scrollable tables

**Total Tests: 15**

### 2. Accounts Management Tests ([accounts.spec.ts](accounts.spec.ts))

Tests for account creation and management:

- **Account Creation**
  - Create Account button and form display
  - Form validation (required fields, minimum capital)
  - Successful account creation
  - Form cancellation
  - Default values

- **Accounts Display**
  - Table with all columns
  - All accounts displayed
  - P&L calculations
  - Color coding for profits/losses
  - Status badges (Active/Inactive)
  - Date formatting

- **User Interactions**
  - Show/hide create form
  - Form submission with loading state
  - Error handling

- **Edge Cases**
  - Empty state
  - API errors
  - Duplicate accounts

**Total Tests: 20**

### 3. Backtest Configuration Tests ([backtest.spec.ts](backtest.spec.ts))

Tests for backtest configuration and execution:

- **Form Elements**
  - Page title and description
  - Account selection dropdown
  - Date range inputs
  - Symbol selection checkboxes
  - Strategy parameters (Short Period, Long Period, Position Size)

- **Temporal Safety**
  - Information banner about temporal safety
  - Day-by-day simulation messaging
  - Future data leakage prevention notice

- **Validation**
  - Required fields
  - Minimum values
  - Disable Run button when invalid
  - Enable when valid

- **Backtest Execution**
  - Submit with correct data structure
  - Navigate to results on success
  - Loading state during execution
  - Error handling

- **Data Persistence**
  - Store results in sessionStorage
  - Maintain form state

**Total Tests: 21**

### 4. Results Visualization Tests ([results.spec.ts](results.spec.ts))

Tests for backtest results display:

- **Performance Metrics**
  - Total Return (dollar amount and percentage)
  - Sharpe Ratio
  - Max Drawdown
  - Win Rate
  - Total Trades
  - Average Win/Loss
  - Profit Factor

- **Charts**
  - Equity Curve (LineChart with Total Equity and Cash)
  - Monthly Returns (BarChart)
  - Chart responsiveness
  - Chart axes and labels

- **Trade History**
  - Table with all columns
  - All trades displayed
  - Date formatting
  - Price formatting
  - P&L color coding
  - Return percentage with sign

- **Navigation**
  - Back to Backtest button
  - Date range display

- **Edge Cases**
  - No results state
  - Large trade history

**Total Tests: 25**

### 5. Integration Tests ([integration.spec.ts](integration.spec.ts))

Tests for complete user workflows:

- **Full Workflow**
  - Dashboard -> Create Account -> Run Backtest -> View Results
  - Data consistency across pages
  - Navigation using menu
  - Browser back/forward buttons

- **State Management**
  - Preserve backtest results across navigation
  - Multiple backtest runs
  - Form state behavior

- **User Experience**
  - Rapid navigation without errors
  - Loading states
  - Consistent branding
  - Temporal safety messaging

**Total Tests: 13**

## Running the Tests

### Prerequisites

- Node.js 16+ installed
- Trading Station API running at `https://localhost:5001` (optional, tests use mocks)
- npm packages installed: `npm install`

### Commands

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run tests with Playwright UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step-by-step
npm run test:e2e:debug

# View HTML test report
npm run test:report
```

### Running Specific Test Files

```bash
# Run only dashboard tests
npx playwright test dashboard.spec.ts

# Run only accounts tests
npx playwright test accounts.spec.ts

# Run only backtest tests
npx playwright test backtest.spec.ts

# Run only results tests
npx playwright test results.spec.ts

# Run only integration tests
npx playwright test integration.spec.ts
```

### Running Specific Tests

```bash
# Run tests matching a pattern
npx playwright test -g "should display dashboard title"

# Run tests in a specific file matching a pattern
npx playwright test dashboard.spec.ts -g "should calculate"
```

## Test Architecture

### Fixtures ([fixtures.ts](fixtures.ts))

Custom fixtures provide:

- **Mock Data**: Realistic test data for accounts, stocks, and backtest results
- **Helper Class**: `TradingStationPage` with methods for common operations
- **API Mocking**: Easy mocking of API responses

### Mock Data Structure

```typescript
interface MockData {
  accounts: Account[]        // 2 test accounts
  stocks: Stock[]           // 3 test stocks (AAPL, MSFT, GOOGL)
  symbols: string[]         // 5 symbols for selection
  backtestResult: BacktestResult  // Complete backtest result with 365 daily snapshots
}
```

### Helper Methods

```typescript
// Navigation
await tradingStation.goto('/')
await tradingStation.navigateToDashboard()
await tradingStation.navigateToBacktest()
await tradingStation.navigateToAccounts()

// API Mocking
await tradingStation.mockGetAccounts(accounts)
await tradingStation.mockGetStocks(stocks)
await tradingStation.mockGetSymbols(symbols)
await tradingStation.mockRunBacktest(result)

// Form Operations
await tradingStation.createAccount(name, capital)
await tradingStation.fillBacktestForm(data)
```

## Configuration

Configuration is in [playwright.config.ts](../playwright.config.ts):

- **Test Directory**: `./e2e`
- **Timeout**: 60 seconds per test
- **Base URL**: `http://localhost:3000`
- **Reporters**: HTML, List, JSON
- **Browser**: Chromium (can add Firefox, WebKit)
- **Web Server**: Automatically starts `npm run dev`

## Test Patterns

### 1. Page Object Pattern

```typescript
test('should display dashboard', async ({ tradingStation, mockData }) => {
  await tradingStation.mockGetAccounts(mockData.accounts)
  await tradingStation.goto('/')
  await tradingStation.waitForLoad()

  await expect(page.locator('h1')).toContainText('Trading Station')
})
```

### 2. API Mocking Pattern

```typescript
test('should handle API errors', async ({ page }) => {
  await page.route('**/api/accounts', (route) => {
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Invalid request' }),
    })
  })

  // Test error handling...
})
```

### 3. Form Testing Pattern

```typescript
test('should validate required fields', async ({ page }) => {
  await page.click('button:has-text("Create")')

  // Form should still be visible (validation failed)
  await expect(page.locator('form')).toBeVisible()
})
```

### 4. Navigation Testing Pattern

```typescript
test('should navigate between pages', async ({ tradingStation }) => {
  await tradingStation.goto('/')
  await tradingStation.navigateToAccounts()

  await expect(page).toHaveURL(/.*accounts/)
})
```

## Assertions

Tests use Playwright's built-in assertions:

```typescript
// Visibility
await expect(element).toBeVisible()
await expect(element).not.toBeVisible()

// Text content
await expect(element).toContainText('text')
await expect(element).toHaveText('exact text')

// URL
await expect(page).toHaveURL(/pattern/)

// Count
await expect(elements).toHaveCount(5)

// Attributes
await expect(element).toBeDisabled()
await expect(element).toBeEnabled()
await expect(element).toBeChecked()

// Custom matchers
expect(value).toBe(expected)
expect(value).toContain(item)
expect(value).toBeGreaterThan(num)
```

## Best Practices

### 1. Use Fixtures for Common Setup

```typescript
test.beforeEach(async ({ tradingStation, mockData }) => {
  await tradingStation.mockGetAccounts(mockData.accounts)
  await tradingStation.goto('/')
})
```

### 2. Mock API Responses

Always mock API responses to:
- Make tests faster
- Make tests reliable (no network issues)
- Test error scenarios
- Avoid hitting real API

### 3. Wait for Load States

```typescript
await tradingStation.waitForLoad()
await page.waitForLoadState('networkidle')
await page.waitForURL(/pattern/)
```

### 4. Use Descriptive Test Names

```typescript
test('should display positive P&L in green with TrendingUp icon', async ({ page }) => {
  // Test implementation
})
```

### 5. Test User Workflows, Not Implementation

Focus on what users see and do:
- ✅ "should display create account form when clicking Create Account button"
- ❌ "should call setShowCreateForm(true) when clicking button"

### 6. Handle Dialogs (Alerts)

```typescript
page.once('dialog', async (dialog) => {
  expect(dialog.message()).toContain('success')
  await dialog.accept()
})
```

### 7. Use Page Locators Strategically

```typescript
// Prefer text content for user-facing elements
page.locator('text=Dashboard')

// Use data-testid for dynamic content
page.locator('[data-testid="account-row-1"]')

// Use CSS selectors for specific styling
page.locator('.text-green-600')

// Combine for precision
page.locator('tr:has-text("Account Name")').locator('.text-green-600')
```

## Continuous Integration

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: cd ui && npm ci

- name: Install Playwright Browsers
  run: cd ui && npx playwright install --with-deps

- name: Run E2E tests
  run: cd ui && npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: ui/playwright-report/
```

## Troubleshooting

### Tests Failing Locally

1. **Clear browser cache**: `npx playwright test --clear-cache`
2. **Update browsers**: `npx playwright install`
3. **Check API is running**: Ensure backend is at `https://localhost:5001`
4. **Check Node version**: Requires Node 16+

### Tests Timing Out

1. Increase timeout in `playwright.config.ts`
2. Check network issues
3. Add explicit waits: `await page.waitForLoadState('networkidle')`

### Flaky Tests

1. Add `await page.waitForLoadState('networkidle')` before assertions
2. Use `waitForSelector` before interacting with elements
3. Avoid using fixed `setTimeout`, use conditional waits

### Debug Mode

```bash
# Run with Playwright Inspector
npm run test:e2e:debug

# Run with browser visible
npm run test:e2e:headed

# Run with UI mode for interactive debugging
npm run test:e2e:ui
```

## Test Metrics

- **Total Test Files**: 5
- **Total Tests**: 94
- **Average Execution Time**: ~2 minutes (headless, with mocks)
- **Browser Coverage**: Chromium (can add Firefox, WebKit)
- **Code Coverage**: End-to-end user workflows

## Maintenance

### When to Update Tests

- **New feature added**: Add new test file or test cases
- **UI changes**: Update selectors if elements changed
- **API changes**: Update mock data structure
- **Bug fixes**: Add regression test

### Updating Mock Data

Mock data is in [fixtures.ts](fixtures.ts):

```typescript
export const mockData: MockData = {
  accounts: [...],
  stocks: [...],
  // Update as needed
}
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Trading Station Specifications](../../CLAUDE.md)
- [Project README](../README.md)

## Support

For issues or questions:
1. Check [CLAUDE.md](../../CLAUDE.md) for project specifications
2. Review test output: `npm run test:report`
3. Run in debug mode: `npm run test:e2e:debug`
4. Check Playwright documentation for assertion/selector help
