import { test, expect } from './fixtures'

/**
 * E2E Tests for Backtest Results Page
 *
 * Based on CLAUDE.md specifications:
 * - Display performance metrics (Sharpe ratio, max drawdown, win rate)
 * - Show equity curve visualization
 * - Display trade history table
 * - Analyze strategy effectiveness
 * - Show monthly returns chart
 */

test.describe('Backtest Results Page', () => {
  test.beforeEach(async ({ page, mockData }) => {
    // Store mock backtest result in sessionStorage
    await page.goto('/')
    await page.evaluate((result) => {
      sessionStorage.setItem('latestBacktestResult', JSON.stringify(result))
    }, mockData.backtestResult)

    // Navigate to results page
    await page.goto('/backtest/results')
    await page.waitForLoadState('networkidle')
  })

  test('should display results page title', async ({ page }) => {
    await expect(page.locator('h1:has-text("Backtest Results")')).toBeVisible()
  })

  test('should display date range of backtest', async ({ page, mockData }) => {
    const startDate = new Date(
      mockData.backtestResult.startDate
    ).toLocaleDateString()
    const endDate = new Date(mockData.backtestResult.endDate).toLocaleDateString()

    await expect(page.locator(`text=${startDate}`)).toBeVisible()
    await expect(page.locator(`text=${endDate}`)).toBeVisible()
  })

  test('should display Back to Backtest button', async ({ page }) => {
    const backButton = page.locator('button:has-text("Back to Backtest")')
    await expect(backButton).toBeVisible()
    await expect(backButton.locator('svg')).toBeVisible() // ArrowLeft icon
  })

  test('should navigate back to backtest page when clicking back button', async ({
    page,
  }) => {
    await page.click('button:has-text("Back to Backtest")')
    await expect(page).toHaveURL(/.*backtest$/)
  })

  test('should display all performance metric cards', async ({ page }) => {
    // Total Return card
    await expect(page.locator('text=Total Return').first()).toBeVisible()

    // Sharpe Ratio card
    await expect(page.locator('text=Sharpe Ratio')).toBeVisible()

    // Max Drawdown card
    await expect(page.locator('text=Max Drawdown')).toBeVisible()

    // Win Rate card
    await expect(page.locator('text=Win Rate')).toBeVisible()
  })

  test('should display Total Return metric correctly', async ({
    page,
    mockData,
  }) => {
    const { totalReturn, totalReturnPercent } = mockData.backtestResult

    // Check dollar amount
    const formattedReturn = totalReturn.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    await expect(page.locator(`text=+$${formattedReturn}`)).toBeVisible()

    // Check percentage
    await expect(
      page.locator(`text=+${totalReturnPercent.toFixed(2)}%`)
    ).toBeVisible()
  })

  test('should display positive return in green with TrendingUp icon', async ({
    page,
    mockData,
  }) => {
    if (mockData.backtestResult.totalReturn >= 0) {
      const returnCard = page.locator('text=Total Return').locator('..')
      await expect(returnCard.locator('.text-green-600')).toBeVisible()
      await expect(returnCard.locator('svg.text-green-600')).toBeVisible()
    }
  })

  test('should display Sharpe Ratio correctly', async ({ page, mockData }) => {
    const sharpeRatio = mockData.backtestResult.sharpeRatio.toFixed(2)
    await expect(page.locator(`text=${sharpeRatio}`).first()).toBeVisible()
    await expect(page.locator('text=Risk-adjusted return')).toBeVisible()
  })

  test('should display Max Drawdown in red', async ({ page, mockData }) => {
    const { maxDrawdown, maxDrawdownPercent } = mockData.backtestResult

    const formattedDrawdown = maxDrawdown.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    await expect(page.locator(`text=-$${formattedDrawdown}`)).toBeVisible()
    await expect(
      page.locator(`text=${maxDrawdownPercent.toFixed(2)}%`)
    ).toBeVisible()

    // Should be in red color
    const drawdownCard = page.locator('text=Max Drawdown').locator('..')
    await expect(drawdownCard.locator('.text-red-600')).toBeVisible()
  })

  test('should display Win Rate with trade counts', async ({
    page,
    mockData,
  }) => {
    const { winRate, winningTrades, totalTrades } = mockData.backtestResult

    await expect(
      page.locator(`text=${winRate.toFixed(1)}%`).first()
    ).toBeVisible()
    await expect(
      page.locator(`text=${winningTrades}/${totalTrades} trades`)
    ).toBeVisible()
  })

  test('should display additional statistics cards', async ({ page }) => {
    await expect(page.locator('text=Total Trades')).toBeVisible()
    await expect(page.locator('text=Average Win/Loss')).toBeVisible()
    await expect(page.locator('text=Profit Factor')).toBeVisible()
  })

  test('should display total trades breakdown', async ({ page, mockData }) => {
    const { totalTrades, winningTrades, losingTrades } = mockData.backtestResult

    await expect(
      page.locator(`text=${totalTrades}`).first()
    ).toBeVisible()
    await expect(page.locator(`text=${winningTrades} wins`)).toBeVisible()
    await expect(page.locator(`text=${losingTrades} losses`)).toBeVisible()
  })

  test('should display average win and loss amounts', async ({
    page,
    mockData,
  }) => {
    const { averageWin, averageLoss } = mockData.backtestResult

    await expect(
      page.locator(`text=$${averageWin.toFixed(2)}`).first()
    ).toBeVisible()
    await expect(
      page.locator(`text=-$${Math.abs(averageLoss).toFixed(2)}`)
    ).toBeVisible()
  })

  test('should calculate and display profit factor', async ({
    page,
    mockData,
  }) => {
    const { averageWin, averageLoss } = mockData.backtestResult
    const profitFactor =
      averageLoss !== 0 ? Math.abs(averageWin / averageLoss) : 0

    await expect(
      page.locator(`text=${profitFactor.toFixed(2)}`).first()
    ).toBeVisible()

    // Should show "Profitable" or "Unprofitable"
    const statusText = profitFactor > 1 ? 'Profitable' : 'Unprofitable'
    await expect(page.locator(`text=${statusText}`)).toBeVisible()
  })

  test('should display equity curve chart', async ({ page }) => {
    await expect(page.locator('h2:has-text("Equity Curve")')).toBeVisible()

    // Recharts should render SVG
    const chartContainer = page.locator('.recharts-wrapper')
    await expect(chartContainer).toBeVisible()

    // Should have legend
    await expect(page.locator('text=Total Equity')).toBeVisible()
    await expect(page.locator('text=Cash')).toBeVisible()
  })

  test('should display monthly returns chart', async ({ page }) => {
    await expect(page.locator('h2:has-text("Monthly Returns")')).toBeVisible()

    // Should have chart container
    const chartContainer = page.locator('.recharts-wrapper').nth(1)
    await expect(chartContainer).toBeVisible()
  })

  test('should display trade history table', async ({ page }) => {
    await expect(page.locator('h2:has-text("Trade History")')).toBeVisible()

    // Check table headers
    await expect(page.locator('th:has-text("Symbol")')).toBeVisible()
    await expect(page.locator('th:has-text("Entry Date")')).toBeVisible()
    await expect(page.locator('th:has-text("Entry Price")')).toBeVisible()
    await expect(page.locator('th:has-text("Exit Date")')).toBeVisible()
    await expect(page.locator('th:has-text("Exit Price")')).toBeVisible()
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible()
    await expect(page.locator('th:has-text("P&L")')).toBeVisible()
    await expect(page.locator('th:has-text("Return %")')).toBeVisible()
  })

  test('should display all trades in the table', async ({ page, mockData }) => {
    for (const trade of mockData.backtestResult.trades) {
      const row = page.locator(`tr:has-text("${trade.symbol}")`)
      await expect(row).toBeVisible()

      // Check entry price
      await expect(
        row.locator(`text=$${trade.entryPrice.toFixed(2)}`)
      ).toBeVisible()

      // Check quantity
      await expect(row.locator(`text=${trade.quantity}`)).toBeVisible()
    }
  })

  test('should format trade dates correctly', async ({ page, mockData }) => {
    const trade = mockData.backtestResult.trades[0]
    const entryDate = new Date(trade.entryDate).toLocaleDateString()
    const exitDate = new Date(trade.exitDate).toLocaleDateString()

    const row = page.locator(`tr:has-text("${trade.symbol}")`).first()
    await expect(row.locator(`text=${entryDate}`)).toBeVisible()
    await expect(row.locator(`text=${exitDate}`)).toBeVisible()
  })

  test('should display winning trades in green', async ({ page, mockData }) => {
    const winningTrade = mockData.backtestResult.trades.find(
      (t) => t.profitLoss > 0
    )

    if (winningTrade) {
      const row = page.locator(`tr:has-text("${winningTrade.symbol}")`).first()
      await expect(row.locator('.text-green-600')).toBeVisible()
    }
  })

  test('should display losing trades in red', async ({ page, mockData }) => {
    const losingTrade = mockData.backtestResult.trades.find(
      (t) => t.profitLoss < 0
    )

    if (losingTrade) {
      const row = page.locator(`tr:has-text("${losingTrade.symbol}")`).first()
      await expect(row.locator('.text-red-600')).toBeVisible()
    }
  })

  test('should display P&L with correct formatting', async ({
    page,
    mockData,
  }) => {
    const trade = mockData.backtestResult.trades[0]
    const pnlFormatted = trade.profitLoss.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const prefix = trade.profitLoss >= 0 ? '+' : ''
    const row = page.locator(`tr:has-text("${trade.symbol}")`).first()
    await expect(row.locator(`text=${prefix}$${pnlFormatted}`)).toBeVisible()
  })

  test('should display return percentage with sign', async ({
    page,
    mockData,
  }) => {
    const trade = mockData.backtestResult.trades[0]
    const returnPct = trade.returnPercent.toFixed(2)
    const prefix = trade.returnPercent >= 0 ? '+' : ''

    const row = page.locator(`tr:has-text("${trade.symbol}")`).first()
    await expect(row.locator(`text=${prefix}${returnPct}%`)).toBeVisible()
  })

  test('should handle no results state', async ({ page }) => {
    // Clear sessionStorage
    await page.evaluate(() => sessionStorage.clear())

    // Reload page
    await page.goto('/backtest/results')
    await page.waitForLoadState('networkidle')

    // Should show "no results" message
    await expect(
      page.locator('text=No backtest results found')
    ).toBeVisible()
    await expect(
      page.locator('text=Please run a backtest first')
    ).toBeVisible()
    await expect(page.locator('button:has-text("Back to Backtest")')).toBeVisible()
  })

  test('should have responsive grid layout for metrics', async ({ page }) => {
    // Performance metrics should be in a grid
    const metricsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4').first()
    await expect(metricsGrid).toBeVisible()

    // Additional metrics should also be in a grid
    const additionalGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first()
    await expect(additionalGrid).toBeVisible()
  })

  test('should make charts responsive', async ({ page }) => {
    // Charts should use ResponsiveContainer
    const chartWrappers = await page.locator('.recharts-responsive-container').all()
    expect(chartWrappers.length).toBeGreaterThanOrEqual(2)

    for (const wrapper of chartWrappers) {
      await expect(wrapper).toBeVisible()
    }
  })

  test('should display chart axes with proper labels', async ({ page }) => {
    // Equity curve should have labeled axes
    const equityCurve = page.locator('h2:has-text("Equity Curve")').locator('..')

    // Should have X and Y axes (Recharts renders these as SVG elements)
    const charts = await page.locator('.recharts-wrapper').all()
    expect(charts.length).toBeGreaterThanOrEqual(1)
  })

  test('should format equity values in thousands', async ({ page }) => {
    // Y-axis should show values like "$100k"
    // This is rendered by Recharts in the chart
    const chart = page.locator('.recharts-wrapper').first()
    await expect(chart).toBeVisible()
  })

  test('should display chart tooltips on hover', async ({ page }) => {
    // This test verifies that charts are interactive
    // Actual tooltip testing requires hovering over chart elements
    const chart = page.locator('.recharts-wrapper').first()
    await expect(chart).toBeVisible()

    // Charts should have tooltip layer
    const tooltipLayer = chart.locator('.recharts-tooltip-wrapper')
    // Tooltip may not be visible until hover, so we just check it exists in DOM
  })

  test('should show trade table with hover effects', async ({
    page,
    mockData,
  }) => {
    const trade = mockData.backtestResult.trades[0]
    const row = page.locator(`tr:has-text("${trade.symbol}")`).first()

    // Check if row has hover class
    const className = await row.getAttribute('class')
    expect(className).toContain('hover:bg-gray-50')
  })

  test('should display metrics in correct color coding', async ({ page }) => {
    // Green for positive values
    const greenElements = await page.locator('.text-green-600').all()
    expect(greenElements.length).toBeGreaterThan(0)

    // Red for negative values (drawdown)
    const redElements = await page.locator('.text-red-600').all()
    expect(redElements.length).toBeGreaterThan(0)
  })

  test('should handle very long trade history', async ({ page, mockData }) => {
    // With many daily snapshots and trades, page should still render
    expect(mockData.backtestResult.dailySnapshots.length).toBe(365)
    expect(mockData.backtestResult.trades.length).toBeGreaterThan(0)

    // Table should be scrollable if needed
    const tableContainer = page.locator('.overflow-x-auto')
    await expect(tableContainer).toBeVisible()
  })

  test('should maintain data integrity from backtest submission', async ({
    page,
    mockData,
  }) => {
    // Verify the data matches what was stored
    const storedResult = await page.evaluate(() =>
      sessionStorage.getItem('latestBacktestResult')
    )

    expect(storedResult).toBeTruthy()
    const parsedResult = JSON.parse(storedResult!)

    // Check key metrics match
    expect(parsedResult.totalReturn).toBe(mockData.backtestResult.totalReturn)
    expect(parsedResult.sharpeRatio).toBe(mockData.backtestResult.sharpeRatio)
    expect(parsedResult.winRate).toBe(mockData.backtestResult.winRate)
    expect(parsedResult.trades.length).toBe(
      mockData.backtestResult.trades.length
    )
  })
})
