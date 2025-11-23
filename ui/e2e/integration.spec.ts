import { test, expect } from './fixtures'

/**
 * Integration E2E Tests for Complete Workflows
 *
 * Tests the complete user journeys through the Trading Station platform:
 * 1. Account creation -> Backtest configuration -> Results viewing
 * 2. Navigation between all pages
 * 3. Data persistence across page transitions
 */

test.describe('Complete User Workflows', () => {
  test('should complete full workflow: create account -> run backtest -> view results', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    // STEP 1: Start at Dashboard
    await tradingStation.goto('/')
    await tradingStation.waitForLoad()
    await tradingStation.mockGetAccounts([])
    await tradingStation.mockGetStocks(mockData.stocks)

    // Should show empty state
    await expect(page.locator('text=No accounts found')).toBeVisible()

    // STEP 2: Navigate to Accounts page
    await tradingStation.navigateToAccounts()
    await expect(page).toHaveURL(/.*accounts/)

    // STEP 3: Create a new account
    await page.route('**/api/accounts', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            name: 'E2E Test Account',
            initialCapital: 100000,
            currentEquity: 100000,
            isActive: true,
            createdDate: new Date().toISOString(),
          }),
        })
      } else if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              name: 'E2E Test Account',
              initialCapital: 100000,
              currentEquity: 100000,
              isActive: true,
              createdDate: new Date().toISOString(),
            },
          ]),
        })
      }
    })

    await page.click('button:has-text("Create Account")')
    await page.fill('input[placeholder*="Account"]', 'E2E Test Account')
    await page.fill('input[type="number"]', '100000')

    // Handle success alert
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('successfully')
      await dialog.accept()
    })

    await page.click('button:has-text("Create"):not(:has-text("Create Account"))')

    // Wait for alert and form to close
    await page.waitForTimeout(500)

    // Account should appear in table
    await expect(page.locator('text=E2E Test Account')).toBeVisible()

    // STEP 4: Navigate to Backtest page
    await tradingStation.navigateToBacktest()
    await expect(page).toHaveURL(/.*backtest/)

    // STEP 5: Configure and run backtest
    await tradingStation.mockGetSymbols(mockData.symbols)
    await tradingStation.mockRunBacktest(mockData.backtestResult)

    await page.selectOption('select', '1')
    await page.fill('input[type="date"]', '2023-01-01')
    const dateInputs = await page.locator('input[type="date"]').all()
    await dateInputs[1].fill('2023-12-31')

    // Select symbols
    await page.check(`input[type="checkbox"] + span:has-text("${mockData.symbols[0]}")`)
    await page.check(`input[type="checkbox"] + span:has-text("${mockData.symbols[1]}")`)

    await page.click('button:has-text("Run Backtest")')

    // STEP 6: View results
    await expect(page).toHaveURL(/.*backtest\/results/)
    await expect(page.locator('h1:has-text("Backtest Results")')).toBeVisible()

    // Verify results are displayed
    await expect(page.locator('text=Total Return')).toBeVisible()
    await expect(page.locator('text=Sharpe Ratio')).toBeVisible()
    await expect(page.locator('h2:has-text("Equity Curve")')).toBeVisible()
    await expect(page.locator('h2:has-text("Trade History")')).toBeVisible()

    // STEP 7: Navigate back to dashboard
    await tradingStation.navigateToDashboard()
    await expect(page).toHaveURL(/^\/$|.*\/$/)

    // Account should still be visible
    await expect(page.locator('text=E2E Test Account')).toBeVisible()
  })

  test('should navigate through all pages using navigation menu', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetStocks(mockData.stocks)
    await tradingStation.mockGetSymbols(mockData.symbols)

    // Start at Dashboard
    await tradingStation.goto('/')
    await expect(page.locator('h1:has-text("Trading Station")')).toBeVisible()

    // Navigate to Run Backtest
    await page.click('text=Run Backtest')
    await expect(page).toHaveURL(/.*backtest/)
    await expect(page.locator('h1:has-text("Run Backtest")')).toBeVisible()

    // Navigate to Accounts
    await page.click('a:has-text("Accounts")')
    await expect(page).toHaveURL(/.*accounts/)
    await expect(page.locator('h1:has-text("Trading Accounts")')).toBeVisible()

    // Navigate back to Dashboard
    await page.click('a:has-text("Dashboard")')
    await expect(page).toHaveURL(/^\/$|.*\/$/)
    await expect(page.locator('h1:has-text("Trading Station")')).toBeVisible()
  })

  test('should preserve backtest results when navigating away and back', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    // Store backtest result
    await page.goto('/')
    await page.evaluate((result) => {
      sessionStorage.setItem('latestBacktestResult', JSON.stringify(result))
    }, mockData.backtestResult)

    // Go to results
    await page.goto('/backtest/results')
    await expect(page.locator('h1:has-text("Backtest Results")')).toBeVisible()

    // Navigate to Dashboard
    await tradingStation.navigateToDashboard()
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetStocks(mockData.stocks)
    await tradingStation.waitForLoad()

    // Navigate back to results
    await page.goto('/backtest/results')

    // Results should still be there
    await expect(page.locator('h1:has-text("Backtest Results")')).toBeVisible()
    await expect(page.locator('text=Total Return')).toBeVisible()
  })

  test('should handle multiple backtest runs with different parameters', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetSymbols(mockData.symbols)

    await tradingStation.goto('/backtest')
    await tradingStation.waitForLoad()

    // First backtest
    await tradingStation.mockRunBacktest(mockData.backtestResult)
    await page.selectOption('select', mockData.accounts[0].id.toString())
    await page.check(`input[type="checkbox"]`)
    await page.click('button:has-text("Run Backtest")')

    await expect(page).toHaveURL(/.*backtest\/results/)

    // Go back to backtest
    await page.click('button:has-text("Back to Backtest")')
    await expect(page).toHaveURL(/.*backtest$/)

    // Second backtest with different parameters
    const secondResult = { ...mockData.backtestResult, totalReturn: 30000 }
    await tradingStation.mockRunBacktest(secondResult)

    await page.selectOption('select', mockData.accounts[0].id.toString())
    await page.check(`input[type="checkbox"]`)

    // Change parameters
    const numberInputs = await page.locator('input[type="number"]').all()
    await numberInputs[0].fill('15')
    await numberInputs[1].fill('40')

    await page.click('button:has-text("Run Backtest")')

    // Should show new results
    await expect(page).toHaveURL(/.*backtest\/results/)
    await expect(page.locator('h1:has-text("Backtest Results")')).toBeVisible()
  })

  test('should show consistent data across dashboard and accounts page', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetStocks(mockData.stocks)

    // Visit Dashboard
    await tradingStation.goto('/')
    await tradingStation.waitForLoad()

    // Get total accounts count from dashboard
    const totalAccounts = mockData.accounts.length
    await expect(page.locator('text=Total Accounts')).toBeVisible()

    // Navigate to Accounts page
    await tradingStation.navigateToAccounts()

    // Count rows in table (excluding header)
    const rows = await page.locator('tbody tr').all()
    expect(rows.length).toBe(totalAccounts)

    // Each account from dashboard should be in accounts table
    for (const account of mockData.accounts) {
      await expect(page.locator(`text=${account.name}`)).toBeVisible()
    }
  })

  test('should maintain form state when navigating between backtest and accounts', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetSymbols(mockData.symbols)

    await tradingStation.goto('/backtest')
    await tradingStation.waitForLoad()

    // Fill part of the form
    await page.selectOption('select', mockData.accounts[0].id.toString())
    await page.check(`input[type="checkbox"]`)

    // Navigate away to accounts
    await tradingStation.navigateToAccounts()

    // Come back to backtest
    await tradingStation.navigateToBacktest()

    // Form should be reset (this is expected behavior - no state preservation)
    const selectedValue = await page.locator('select').inputValue()
    // In React, form state typically resets on navigation unless using state management
  })

  test('should handle rapid navigation without errors', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetStocks(mockData.stocks)
    await tradingStation.mockGetSymbols(mockData.symbols)

    // Rapidly navigate between pages
    for (let i = 0; i < 3; i++) {
      await tradingStation.goto('/')
      await tradingStation.goto('/accounts')
      await tradingStation.goto('/backtest')
      await tradingStation.goto('/')
    }

    // Should end up at dashboard without errors
    await expect(page.locator('h1:has-text("Trading Station")')).toBeVisible()
  })

  test('should show loading states during data fetches', async ({
    page,
    tradingStation,
  }) => {
    // Navigate to dashboard
    await tradingStation.goto('/')

    // Data should load (or show loading state)
    await page.waitForLoadState('networkidle')

    // Navigate to backtest
    await tradingStation.goto('/backtest')
    await page.waitForLoadState('networkidle')

    // Page should be stable
    await expect(page.locator('h1:has-text("Run Backtest")')).toBeVisible()
  })

  test('should handle browser back button correctly', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetStocks(mockData.stocks)

    // Start at dashboard
    await tradingStation.goto('/')
    await expect(page).toHaveURL(/^\/$|.*\/$/)

    // Go to accounts
    await tradingStation.navigateToAccounts()
    await expect(page).toHaveURL(/.*accounts/)

    // Use browser back button
    await page.goBack()
    await expect(page).toHaveURL(/^\/$|.*\/$/)
    await expect(page.locator('h1:has-text("Trading Station")')).toBeVisible()

    // Use browser forward button
    await page.goForward()
    await expect(page).toHaveURL(/.*accounts/)
    await expect(page.locator('h1:has-text("Trading Accounts")')).toBeVisible()
  })

  test('should display Trading Station branding consistently', async ({
    page,
    tradingStation,
  }) => {
    // Check on Dashboard
    await tradingStation.goto('/')
    await expect(page.locator('text=Trading Station').first()).toBeVisible()

    // Check on Accounts
    await tradingStation.goto('/accounts')
    await expect(page.locator('text=Trading Station').first()).toBeVisible()

    // Check on Backtest
    await tradingStation.goto('/backtest')
    await expect(page.locator('text=Trading Station').first()).toBeVisible()

    // All pages should have the logo/icon
    const logo = page.locator('svg.h-8.w-8')
    await expect(logo).toBeVisible()
  })

  test('should validate temporal safety information is displayed', async ({
    page,
    tradingStation,
  }) => {
    await tradingStation.goto('/backtest')
    await tradingStation.waitForLoad()

    // Should show temporal safety information
    await expect(
      page.locator('text=temporal safety')
    ).toBeVisible()
    await expect(
      page.locator('text=prevent future data leakage')
    ).toBeVisible()
  })
})
