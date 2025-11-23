import { test, expect } from './fixtures'

/**
 * E2E Tests for Accounts Management Page
 *
 * Based on CLAUDE.md specifications:
 * - View all trading accounts
 * - Create new accounts with initial capital
 * - Display account status and performance metrics
 * - Manage virtual trading accounts with risk management
 */

test.describe('Accounts Management Page', () => {
  test.beforeEach(async ({ tradingStation, mockData }) => {
    // Mock API responses
    await tradingStation.mockGetAccounts(mockData.accounts)

    // Navigate to accounts page
    await tradingStation.goto('/accounts')
    await tradingStation.waitForLoad()
  })

  test('should display accounts page title and description', async ({ page }) => {
    await expect(page.locator('h1:has-text("Trading Accounts")')).toBeVisible()
    await expect(
      page.locator('text=Manage your trading accounts for backtesting')
    ).toBeVisible()
  })

  test('should display Create Account button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Account")')
    await expect(createButton).toBeVisible()
    await expect(createButton.locator('svg')).toBeVisible() // PlusCircle icon
  })

  test('should show create account form when clicking Create Account button', async ({
    page,
  }) => {
    await page.click('button:has-text("Create Account")')

    // Form should be visible
    await expect(page.locator('h2:has-text("Create New Account")')).toBeVisible()
    await expect(page.locator('label:has-text("Account Name")')).toBeVisible()
    await expect(page.locator('label:has-text("Initial Capital")')).toBeVisible()

    // Inputs should be present
    await expect(
      page.locator('input[placeholder*="Trading Account"]')
    ).toBeVisible()
    await expect(page.locator('input[type="number"]')).toBeVisible()

    // Buttons should be present
    await expect(page.locator('button:has-text("Create")')).toBeVisible()
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
  })

  test('should hide create account form when clicking Cancel button', async ({
    page,
  }) => {
    // Open form
    await page.click('button:has-text("Create Account")')
    await expect(page.locator('h2:has-text("Create New Account")')).toBeVisible()

    // Click Cancel
    await page.click('button:has-text("Cancel")')

    // Form should be hidden
    await expect(
      page.locator('h2:has-text("Create New Account")')
    ).not.toBeVisible()
  })

  test('should require account name to create account', async ({ page }) => {
    await page.click('button:has-text("Create Account")')

    // Try to submit without name
    await page.fill('input[type="number"]', '100000')
    await page.click('button:has-text("Create"):not(:has-text("Create Account"))')

    // Form should still be visible (validation failed)
    await expect(page.locator('h2:has-text("Create New Account")')).toBeVisible()
  })

  test('should create new account with valid data', async ({
    page,
    tradingStation,
  }) => {
    // Mock successful account creation
    await page.route('**/api/accounts', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            name: 'New Test Account',
            initialCapital: 150000,
            currentEquity: 150000,
            isActive: true,
            createdDate: new Date().toISOString(),
          }),
        })
      } else {
        route.continue()
      }
    })

    // Open form
    await page.click('button:has-text("Create Account")')

    // Fill form
    await page.fill('input[placeholder*="Trading Account"]', 'New Test Account')
    await page.fill('input[type="number"]', '150000')

    // Submit
    await page.click('button:has-text("Create"):not(:has-text("Create Account"))')

    // Should show success message (alert)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('successfully')
      await dialog.accept()
    })

    // Wait a bit for the alert
    await page.waitForTimeout(500)
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

  test('should display all accounts in the table', async ({ page, mockData }) => {
    for (const account of mockData.accounts) {
      const row = page.locator(`tr:has-text("${account.name}")`)
      await expect(row).toBeVisible()

      // Check ID
      await expect(row.locator(`text=${account.id}`)).toBeVisible()

      // Check initial capital formatting
      await expect(
        row.locator(`text=$${account.initialCapital.toLocaleString()}`)
      ).toBeVisible()

      // Check current equity
      await expect(
        row.locator(`text=$${account.currentEquity.toLocaleString()}`)
      ).toBeVisible()
    }
  })

  test('should calculate P&L correctly for each account', async ({
    page,
    mockData,
  }) => {
    for (const account of mockData.accounts) {
      const row = page.locator(`tr:has-text("${account.name}")`)
      const pnl = account.currentEquity - account.initialCapital
      const pnlPercent = ((pnl / account.initialCapital) * 100).toFixed(2)

      // P&L should be visible in the row
      await expect(row).toBeVisible()

      // Check that percentage is displayed
      await expect(row.locator(`text=${pnlPercent}%`)).toBeVisible()
    }
  })

  test('should display positive P&L in green color', async ({
    page,
    mockData,
  }) => {
    const positiveAccount = mockData.accounts.find(
      (acc) => acc.currentEquity > acc.initialCapital
    )

    if (positiveAccount) {
      const row = page.locator(`tr:has-text("${positiveAccount.name}")`)
      const pnlCell = row.locator('td.text-green-600')
      await expect(pnlCell).toBeVisible()
    }
  })

  test('should display negative P&L in red color', async ({
    page,
    mockData,
  }) => {
    const negativeAccount = mockData.accounts.find(
      (acc) => acc.currentEquity < acc.initialCapital
    )

    if (negativeAccount) {
      const row = page.locator(`tr:has-text("${negativeAccount.name}")`)
      const pnlCell = row.locator('td.text-red-600')
      await expect(pnlCell).toBeVisible()
    }
  })

  test('should display Active status badge in green', async ({
    page,
    mockData,
  }) => {
    const activeAccount = mockData.accounts.find((acc) => acc.isActive)

    if (activeAccount) {
      const row = page.locator(`tr:has-text("${activeAccount.name}")`)
      const statusBadge = row.locator('.bg-green-100.text-green-800')
      await expect(statusBadge).toBeVisible()
      await expect(statusBadge).toContainText('Active')
    }
  })

  test('should display Inactive status badge in gray', async ({
    page,
    tradingStation,
  }) => {
    // Mock with an inactive account
    await tradingStation.mockGetAccounts([
      {
        id: 99,
        name: 'Inactive Account',
        initialCapital: 50000,
        currentEquity: 50000,
        isActive: false,
        createdDate: new Date().toISOString(),
      },
    ])

    await tradingStation.goto('/accounts')
    await tradingStation.waitForLoad()

    const row = page.locator('tr:has-text("Inactive Account")')
    const statusBadge = row.locator('.bg-gray-100.text-gray-800')
    await expect(statusBadge).toBeVisible()
    await expect(statusBadge).toContainText('Inactive')
  })

  test('should format dates correctly', async ({ page, mockData }) => {
    const account = mockData.accounts[0]
    const createdDate = new Date(account.createdDate).toLocaleDateString()

    const row = page.locator(`tr:has-text("${account.name}")`)
    await expect(row.locator(`text=${createdDate}`)).toBeVisible()
  })

  test('should show empty state when no accounts exist', async ({
    page,
    tradingStation,
  }) => {
    // Mock empty accounts
    await tradingStation.mockGetAccounts([])
    await tradingStation.goto('/accounts')
    await tradingStation.waitForLoad()

    // Should show empty message
    await expect(
      page.locator('text=No accounts found. Create one to get started.')
    ).toBeVisible()
  })

  test('should validate minimum capital amount', async ({ page }) => {
    await page.click('button:has-text("Create Account")')

    const capitalInput = page.locator('input[type="number"]')

    // Check min attribute
    const minValue = await capitalInput.getAttribute('min')
    expect(minValue).toBe('1000')

    // Check step attribute for increment
    const stepValue = await capitalInput.getAttribute('step')
    expect(stepValue).toBe('1000')
  })

  test('should have default initial capital value', async ({ page }) => {
    await page.click('button:has-text("Create Account")')

    const capitalInput = page.locator('input[type="number"]')
    const defaultValue = await capitalInput.inputValue()

    // Should have a default value (100000 based on component)
    expect(parseInt(defaultValue)).toBe(100000)
  })

  test('should disable Create button while submitting', async ({ page }) => {
    // Mock delayed response
    await page.route('**/api/accounts', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      }
    })

    await page.click('button:has-text("Create Account")')
    await page.fill('input[placeholder*="Trading Account"]', 'Test')
    await page.fill('input[type="number"]', '100000')

    // Click Create
    const createButton = page.locator(
      'button:has-text("Create"):not(:has-text("Create Account"))'
    )
    await createButton.click()

    // Button should be disabled
    await expect(createButton).toBeDisabled()

    // Should show "Creating..." text
    await expect(page.locator('text=Creating...')).toBeVisible()
  })

  test('should highlight row on hover', async ({ page, mockData }) => {
    const row = page.locator(`tr:has-text("${mockData.accounts[0].name}")`)

    // Check if row has hover class
    const className = await row.getAttribute('class')
    expect(className).toContain('hover:bg-gray-50')
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/accounts', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Account name already exists' }),
        })
      }
    })

    await page.click('button:has-text("Create Account")')
    await page.fill('input[placeholder*="Trading Account"]', 'Duplicate')
    await page.fill('input[type="number"]', '100000')

    // Listen for alert
    let alertMessage = ''
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message()
      await dialog.accept()
    })

    await page.click('button:has-text("Create"):not(:has-text("Create Account"))')

    // Wait for alert
    await page.waitForTimeout(500)

    // Should show error message
    expect(alertMessage).toContain('Error')
  })
})
