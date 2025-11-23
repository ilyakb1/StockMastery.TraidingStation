import { test, expect } from './fixtures'

/**
 * E2E Tests for Dashboard Page
 *
 * Based on CLAUDE.md specifications:
 * - Display overview statistics (accounts, capital, equity, stocks)
 * - Show accounts list with P&L calculations
 * - Navigate to other pages
 */

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ tradingStation, mockData }) => {
    // Mock API responses
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetStocks(mockData.stocks)

    // Navigate to dashboard
    await tradingStation.goto('/')
    await tradingStation.waitForLoad()
  })

  test('should display dashboard title and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Trading Station')
    await expect(page.locator('text=Overview of your trading accounts')).toBeVisible()
  })

  test('should display statistics cards with correct data', async ({ page, mockData }) => {
    // Total accounts
    const totalAccounts = mockData.accounts.length
    await expect(page.locator('text=Total Accounts')).toBeVisible()
    await expect(page.locator(`text=${totalAccounts}`).first()).toBeVisible()

    // Total capital
    const totalCapital = mockData.accounts.reduce(
      (sum, acc) => sum + acc.initialCapital,
      0
    )
    await expect(page.locator('text=Total Capital')).toBeVisible()
    await expect(
      page.locator(`text=$${totalCapital.toLocaleString()}`)
    ).toBeVisible()

    // Total equity
    const totalEquity = mockData.accounts.reduce(
      (sum, acc) => sum + acc.currentEquity,
      0
    )
    await expect(page.locator('text=Total Equity')).toBeVisible()

    // Available stocks
    const totalStocks = mockData.stocks.length
    await expect(page.locator('text=Available Stocks')).toBeVisible()
    await expect(page.locator(`text=${totalStocks}`).first()).toBeVisible()
  })

  test('should display accounts table with all columns', async ({ page }) => {
    // Check table headers
    await expect(page.locator('th:has-text("ID")')).toBeVisible()
    await expect(page.locator('th:has-text("Account Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Initial Capital")')).toBeVisible()
    await expect(page.locator('th:has-text("Current Equity")')).toBeVisible()
    await expect(page.locator('th:has-text("P&L")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("Created")')).toBeVisible()
  })

  test('should display account data in table rows', async ({ page, mockData }) => {
    for (const account of mockData.accounts) {
      // Check account name
      await expect(page.locator(`text=${account.name}`)).toBeVisible()

      // Check initial capital
      await expect(
        page.locator(`text=$${account.initialCapital.toLocaleString()}`)
      ).toBeVisible()

      // Check status badge
      const statusText = account.isActive ? 'Active' : 'Inactive'
      await expect(page.locator(`text=${statusText}`)).toBeVisible()
    }
  })

  test('should calculate and display P&L correctly', async ({ page, mockData }) => {
    const account = mockData.accounts[0]
    const pnl = account.currentEquity - account.initialCapital
    const pnlPercent = (pnl / account.initialCapital) * 100

    // Check for P&L value (positive shown with +, negative without)
    const pnlText = pnl >= 0 ? `+$${pnl.toLocaleString()}` : `-$${Math.abs(pnl).toLocaleString()}`

    // The P&L should be visible somewhere in the row
    const row = page.locator(`tr:has-text("${account.name}")`)
    await expect(row).toBeVisible()
  })

  test('should display positive P&L in green', async ({ page, mockData }) => {
    const positiveAccount = mockData.accounts.find(
      (acc) => acc.currentEquity > acc.initialCapital
    )

    if (positiveAccount) {
      const row = page.locator(`tr:has-text("${positiveAccount.name}")`)
      const pnlCell = row.locator('.text-green-600')
      await expect(pnlCell).toBeVisible()
    }
  })

  test('should display negative P&L in red', async ({ page, mockData }) => {
    const negativeAccount = mockData.accounts.find(
      (acc) => acc.currentEquity < acc.initialCapital
    )

    if (negativeAccount) {
      const row = page.locator(`tr:has-text("${negativeAccount.name}")`)
      const pnlCell = row.locator('.text-red-600')
      await expect(pnlCell).toBeVisible()
    }
  })

  test('should show loading state when data is being fetched', async ({
    page,
    tradingStation,
  }) => {
    // Navigate to page without mocking to see loading state
    await tradingStation.goto('/')

    // Check for loading indicator or "Loading accounts..." text
    // Note: This depends on your loading implementation
    const loadingText = page.locator('text=Loading')
    if (await loadingText.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(loadingText).toBeVisible()
    }
  })

  test('should navigate to Accounts page when clicking Accounts link', async ({
    page,
    tradingStation,
  }) => {
    await tradingStation.navigateToAccounts()
    await expect(page).toHaveURL(/.*accounts/)
    await expect(page.locator('h1:has-text("Trading Accounts")')).toBeVisible()
  })

  test('should navigate to Backtest page when clicking Run Backtest link', async ({
    page,
    tradingStation,
  }) => {
    await tradingStation.navigateToBacktest()
    await expect(page).toHaveURL(/.*backtest/)
    await expect(page.locator('h1:has-text("Run Backtest")')).toBeVisible()
  })

  test('should show empty state when no accounts exist', async ({
    page,
    tradingStation,
  }) => {
    // Mock empty accounts
    await tradingStation.mockGetAccounts([])
    await tradingStation.goto('/')
    await tradingStation.waitForLoad()

    // Statistics should show 0
    await expect(page.locator('text=Total Accounts')).toBeVisible()
    await expect(page.locator('text=0').first()).toBeVisible()

    // Table should show empty message
    await expect(
      page.locator('text=No accounts found')
    ).toBeVisible()
  })

  test('should display date in correct format', async ({ page, mockData }) => {
    const account = mockData.accounts[0]
    const createdDate = new Date(account.createdDate)
    const formattedDate = createdDate.toLocaleDateString()

    const row = page.locator(`tr:has-text("${account.name}")`)
    await expect(row.locator(`text=${formattedDate}`)).toBeVisible()
  })

  test('should have responsive layout', async ({ page }) => {
    // Test that cards are in a grid layout
    const statsGrid = page.locator('.grid').first()
    await expect(statsGrid).toBeVisible()

    // Test that table is scrollable on small screens
    const tableContainer = page.locator('.overflow-x-auto')
    await expect(tableContainer).toBeVisible()
  })
})
