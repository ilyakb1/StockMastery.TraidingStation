import { test, expect } from './fixtures'

/**
 * E2E Tests for Backtest Configuration and Execution
 *
 * Based on CLAUDE.md specifications:
 * - Test trading strategies against historical market data
 * - Configure date range, symbols, and strategy parameters
 * - Enforce temporal safety to prevent look-ahead bias
 * - Execute backtest and navigate to results
 * - Moving Average Crossover strategy configuration
 */

test.describe('Backtest Configuration Page', () => {
  test.beforeEach(async ({ tradingStation, mockData }) => {
    // Mock API responses
    await tradingStation.mockGetAccounts(mockData.accounts)
    await tradingStation.mockGetSymbols(mockData.symbols)

    // Navigate to backtest page
    await tradingStation.goto('/backtest')
    await tradingStation.waitForLoad()
  })

  test('should display backtest page title and description', async ({ page }) => {
    await expect(page.locator('h1:has-text("Run Backtest")')).toBeVisible()
    await expect(
      page.locator('text=Configure and execute a backtest with historical data')
    ).toBeVisible()
  })

  test('should display backtest configuration section', async ({ page }) => {
    await expect(
      page.locator('h2:has-text("Backtest Configuration")')
    ).toBeVisible()
  })

  test('should display account selection dropdown', async ({ page }) => {
    await expect(page.locator('label:has-text("Trading Account")')).toBeVisible()

    const select = page.locator('select')
    await expect(select).toBeVisible()

    // Should have "Select an account" option
    await expect(select.locator('option:has-text("Select an account")')).toBeVisible()
  })

  test('should populate account dropdown with available accounts', async ({
    page,
    mockData,
  }) => {
    const select = page.locator('select')

    for (const account of mockData.accounts) {
      const optionText = `${account.name} ($${account.initialCapital.toLocaleString()})`
      await expect(select.locator(`option:has-text("${account.name}")`)).toBeVisible()
    }
  })

  test('should display date range inputs', async ({ page }) => {
    await expect(page.locator('label:has-text("Start Date")')).toBeVisible()
    await expect(page.locator('label:has-text("End Date")')).toBeVisible()

    const dateInputs = page.locator('input[type="date"]')
    await expect(dateInputs).toHaveCount(2)
  })

  test('should have default date values', async ({ page }) => {
    const dateInputs = await page.locator('input[type="date"]').all()

    // First input (start date)
    const startDate = await dateInputs[0].inputValue()
    expect(startDate).toBe('2023-01-01')

    // Second input (end date)
    const endDate = await dateInputs[1].inputValue()
    expect(endDate).toBe('2023-12-31')
  })

  test('should display symbol selection section', async ({ page }) => {
    await expect(page.locator('label:has-text("Select Symbols")')).toBeVisible()

    // Should have checkboxes container
    const symbolsContainer = page.locator('.border.rounded-md.p-4')
    await expect(symbolsContainer).toBeVisible()
  })

  test('should display available symbols as checkboxes', async ({
    page,
    mockData,
  }) => {
    for (const symbol of mockData.symbols) {
      const checkbox = page.locator(`input[type="checkbox"] + span:has-text("${symbol}")`)
      await expect(checkbox).toBeVisible()
    }
  })

  test('should allow selecting multiple symbols', async ({ page, mockData }) => {
    // Select first two symbols
    for (let i = 0; i < 2; i++) {
      const symbol = mockData.symbols[i]
      await page.check(`input[type="checkbox"] + span:has-text("${symbol}")`)
    }

    // Verify checkboxes are checked
    for (let i = 0; i < 2; i++) {
      const symbol = mockData.symbols[i]
      const checkbox = page.locator(
        `input[type="checkbox"]:near(:text("${symbol}"))`
      )
      await expect(checkbox.first()).toBeChecked()
    }
  })

  test('should display Moving Average Crossover strategy section', async ({
    page,
  }) => {
    await expect(
      page.locator('h3:has-text("Strategy: Moving Average Crossover")')
    ).toBeVisible()
  })

  test('should display strategy parameters', async ({ page }) => {
    await expect(page.locator('label:has-text("Short Period")')).toBeVisible()
    await expect(page.locator('label:has-text("Long Period")')).toBeVisible()
    await expect(page.locator('label:has-text("Position Size")')).toBeVisible()

    // Should have 3 number inputs for strategy parameters
    const numberInputs = await page.locator('input[type="number"]').all()
    expect(numberInputs.length).toBeGreaterThanOrEqual(3)
  })

  test('should have default strategy parameter values', async ({ page }) => {
    const numberInputs = await page.locator('input[type="number"]').all()

    // Short period default: 20
    const shortPeriod = await numberInputs[0].inputValue()
    expect(parseInt(shortPeriod)).toBe(20)

    // Long period default: 50
    const longPeriod = await numberInputs[1].inputValue()
    expect(parseInt(longPeriod)).toBe(50)

    // Position size default: 100
    const positionSize = await numberInputs[2].inputValue()
    expect(parseInt(positionSize)).toBe(100)
  })

  test('should display temporal safety information banner', async ({ page }) => {
    // Check for info banner with temporal safety message
    await expect(
      page.locator('text=This backtest uses temporal safety')
    ).toBeVisible()
    await expect(
      page.locator('text=prevent future data leakage')
    ).toBeVisible()
    await expect(
      page.locator('text=day-by-day')
    ).toBeVisible()
  })

  test('should display Run Backtest button', async ({ page }) => {
    const runButton = page.locator('button:has-text("Run Backtest")')
    await expect(runButton).toBeVisible()
    await expect(runButton.locator('svg')).toBeVisible() // Play icon
  })

  test('should disable Run button when no symbols selected', async ({ page }) => {
    // Ensure no symbols are selected
    const checkboxes = await page.locator('input[type="checkbox"]').all()
    for (const checkbox of checkboxes) {
      if (await checkbox.isChecked()) {
        await checkbox.uncheck()
      }
    }

    const runButton = page.locator('button:has-text("Run Backtest")')
    await expect(runButton).toBeDisabled()
  })

  test('should disable Run button when no account selected', async ({ page }) => {
    // Select symbols but no account
    await page.check(`input[type="checkbox"]`)

    const select = page.locator('select')
    await select.selectOption('0') // "Select an account" option

    const runButton = page.locator('button:has-text("Run Backtest")')
    await expect(runButton).toBeDisabled()
  })

  test('should enable Run button when form is valid', async ({
    page,
    mockData,
  }) => {
    // Select account
    await page.selectOption('select', mockData.accounts[0].id.toString())

    // Select at least one symbol
    await page.check(`input[type="checkbox"]`)

    const runButton = page.locator('button:has-text("Run Backtest")')
    await expect(runButton).toBeEnabled()
  })

  test('should submit backtest request with correct data', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    let requestData: any = null

    // Mock backtest API and capture request
    await page.route('**/api/backtest/run', (route) => {
      requestData = JSON.parse(route.request().postData() || '{}')
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData.backtestResult),
      })
    })

    // Fill form
    await page.selectOption('select', mockData.accounts[0].id.toString())
    await page.fill('input[type="date"]', '2023-01-01')
    const dateInputs = await page.locator('input[type="date"]').all()
    await dateInputs[1].fill('2023-12-31')

    // Select symbols
    await page.check(`input[type="checkbox"] + span:has-text("${mockData.symbols[0]}")`)
    await page.check(`input[type="checkbox"] + span:has-text("${mockData.symbols[1]}")`)

    // Set strategy parameters
    const numberInputs = await page.locator('input[type="number"]').all()
    await numberInputs[0].fill('10')
    await numberInputs[1].fill('30')
    await numberInputs[2].fill('200')

    // Submit
    await page.click('button:has-text("Run Backtest")')

    // Wait for navigation
    await page.waitForURL(/.*backtest\/results/, { timeout: 5000 })

    // Verify request data
    expect(requestData).toBeTruthy()
    expect(requestData.accountId).toBe(mockData.accounts[0].id)
    expect(requestData.startDate).toBe('2023-01-01')
    expect(requestData.endDate).toBe('2023-12-31')
    expect(requestData.symbols).toContain(mockData.symbols[0])
    expect(requestData.symbols).toContain(mockData.symbols[1])
    expect(requestData.shortPeriod).toBe(10)
    expect(requestData.longPeriod).toBe(30)
    expect(requestData.positionSize).toBe(200)
    expect(requestData.strategyType).toBe('ma_crossover')
  })

  test('should navigate to results page after successful backtest', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    // Mock successful backtest
    await tradingStation.mockRunBacktest(mockData.backtestResult)

    // Fill and submit form
    await page.selectOption('select', mockData.accounts[0].id.toString())
    await page.check(`input[type="checkbox"]`)
    await page.click('button:has-text("Run Backtest")')

    // Should navigate to results page
    await expect(page).toHaveURL(/.*backtest\/results/, { timeout: 5000 })
  })

  test('should show loading state while backtest is running', async ({
    page,
    mockData,
  }) => {
    // Mock delayed response
    await page.route('**/api/backtest/run', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData.backtestResult),
      })
    })

    // Fill and submit form
    await page.selectOption('select', mockData.accounts[0].id.toString())
    await page.check(`input[type="checkbox"]`)

    const runButton = page.locator('button:has-text("Run Backtest")')
    await runButton.click()

    // Should show "Running..." text
    await expect(page.locator('text=Running...')).toBeVisible()

    // Button should be disabled
    await expect(runButton).toBeDisabled()
  })

  test('should handle API errors and show error message', async ({ page }) => {
    // Mock error response
    await page.route('**/api/backtest/run', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid date range' }),
      })
    })

    // Fill and submit form
    await page.selectOption('select', '1')
    await page.check(`input[type="checkbox"]`)

    // Listen for alert
    let alertMessage = ''
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message()
      await dialog.accept()
    })

    await page.click('button:has-text("Run Backtest")')

    // Wait for alert
    await page.waitForTimeout(500)

    // Should show error in alert
    expect(alertMessage).toContain('Error')
  })

  test('should validate date inputs are required', async ({ page }) => {
    const dateInputs = await page.locator('input[type="date"]').all()

    // Check required attribute
    const startRequired = await dateInputs[0].getAttribute('required')
    const endRequired = await dateInputs[1].getAttribute('required')

    expect(startRequired).toBe('')
    expect(endRequired).toBe('')
  })

  test('should validate strategy parameters have minimum values', async ({
    page,
  }) => {
    const numberInputs = await page.locator('input[type="number"]').all()

    // All should have min="1"
    for (let i = 0; i < 3; i++) {
      const minValue = await numberInputs[i].getAttribute('min')
      expect(minValue).toBe('1')
    }
  })

  test('should allow deselecting symbols', async ({ page, mockData }) => {
    // Select a symbol
    const symbol = mockData.symbols[0]
    await page.check(`input[type="checkbox"] + span:has-text("${symbol}")`)

    // Verify it's checked
    const checkbox = page.locator(
      `input[type="checkbox"]:near(:text("${symbol}"))`
    ).first()
    await expect(checkbox).toBeChecked()

    // Uncheck it
    await page.uncheck(`input[type="checkbox"] + span:has-text("${symbol}")`)

    // Verify it's unchecked
    await expect(checkbox).not.toBeChecked()
  })

  test('should store backtest result in sessionStorage', async ({
    page,
    tradingStation,
    mockData,
  }) => {
    // Mock backtest
    await tradingStation.mockRunBacktest(mockData.backtestResult)

    // Fill and submit
    await page.selectOption('select', mockData.accounts[0].id.toString())
    await page.check(`input[type="checkbox"]`)
    await page.click('button:has-text("Run Backtest")')

    // Wait for navigation
    await page.waitForURL(/.*backtest\/results/)

    // Check sessionStorage
    const storedResult = await page.evaluate(() =>
      sessionStorage.getItem('latestBacktestResult')
    )

    expect(storedResult).toBeTruthy()
    const parsedResult = JSON.parse(storedResult!)
    expect(parsedResult.totalReturn).toBe(mockData.backtestResult.totalReturn)
  })

  test('should have responsive layout', async ({ page }) => {
    // Check grid layout for parameters
    const grid = page.locator('.grid.grid-cols-3')
    await expect(grid).toBeVisible()

    // Check symbols are in a grid layout
    const symbolsGrid = page.locator('.grid.grid-cols-3')
    await expect(symbolsGrid).toBeVisible()
  })

  test('should show required account selection message', async ({ page }) => {
    const select = page.locator('select')
    const required = await select.getAttribute('required')
    expect(required).toBe('')
  })
})
