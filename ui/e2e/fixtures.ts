import { test as base, expect, Page } from '@playwright/test'

/**
 * Custom fixtures for Trading Station E2E tests
 * Provides common setup and helper functions for testing
 */

export interface MockData {
  accounts: Account[]
  stocks: Stock[]
  symbols: string[]
  backtestResult: BacktestResult
}

export interface Account {
  id: number
  name: string
  initialCapital: number
  currentEquity: number
  isActive: boolean
  createdDate: string
}

export interface Stock {
  symbol: string
  market: string
  name: string
  sector: string
}

export interface BacktestResult {
  accountId: number
  startDate: string
  endDate: string
  initialCapital: number
  finalEquity: number
  totalReturn: number
  totalReturnPercent: number
  sharpeRatio: number
  maxDrawdown: number
  maxDrawdownPercent: number
  winRate: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  averageWin: number
  averageLoss: number
  trades: Trade[]
  dailySnapshots: DailySnapshot[]
}

export interface Trade {
  symbol: string
  entryDate: string
  entryPrice: number
  exitDate: string
  exitPrice: number
  quantity: number
  profitLoss: number
  returnPercent: number
}

export interface DailySnapshot {
  date: string
  equity: number
  cash: number
}

// Helper functions
export class TradingStationPage {
  constructor(public page: Page) {}

  async goto(path: string = '/') {
    await this.page.goto(path)
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToDashboard() {
    await this.page.click('text=Dashboard')
    await this.waitForLoad()
  }

  async navigateToBacktest() {
    await this.page.click('text=Run Backtest')
    await this.waitForLoad()
  }

  async navigateToAccounts() {
    await this.page.click('text=Accounts')
    await this.waitForLoad()
  }

  // API mocking removed - tests now use real API calls to Docker containers

  async createAccount(name: string, initialCapital: number) {
    await this.page.click('text=Create Account')
    await this.page.fill('input[placeholder*="Account"]', name)
    await this.page.fill('input[type="number"]', initialCapital.toString())
    await this.page.click('button:has-text("Create")')
  }

  async fillBacktestForm(data: {
    accountId: number
    startDate: string
    endDate: string
    symbols: string[]
    shortPeriod?: number
    longPeriod?: number
    positionSize?: number
  }) {
    await this.page.selectOption('select', data.accountId.toString())
    await this.page.fill('input[type="date"]', data.startDate)
    const dateInputs = await this.page.locator('input[type="date"]').all()
    await dateInputs[1].fill(data.endDate)

    for (const symbol of data.symbols) {
      await this.page.check(`input[type="checkbox"] + span:has-text("${symbol}")`)
    }

    if (data.shortPeriod) {
      const numberInputs = await this.page.locator('input[type="number"]').all()
      await numberInputs[0].fill(data.shortPeriod.toString())
    }

    if (data.longPeriod) {
      const numberInputs = await this.page.locator('input[type="number"]').all()
      await numberInputs[1].fill(data.longPeriod.toString())
    }

    if (data.positionSize) {
      const numberInputs = await this.page.locator('input[type="number"]').all()
      await numberInputs[2].fill(data.positionSize.toString())
    }
  }
}

// Create test fixtures
export const test = base.extend<{
  tradingStation: TradingStationPage
  mockData: MockData
}>({
  tradingStation: async ({ page }, use) => {
    const tradingStation = new TradingStationPage(page)
    await use(tradingStation)
  },

  mockData: async ({}, use) => {
    const mockData: MockData = {
      accounts: [
        {
          id: 1,
          name: 'Test Account 1',
          initialCapital: 100000,
          currentEquity: 105000,
          isActive: true,
          createdDate: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Test Account 2',
          initialCapital: 50000,
          currentEquity: 48000,
          isActive: true,
          createdDate: '2024-01-15T00:00:00Z',
        },
      ],
      stocks: [
        {
          symbol: 'AAPL',
          market: 'US',
          name: 'Apple Inc.',
          sector: 'Technology',
        },
        {
          symbol: 'MSFT',
          market: 'US',
          name: 'Microsoft Corporation',
          sector: 'Technology',
        },
        {
          symbol: 'GOOGL',
          market: 'US',
          name: 'Alphabet Inc.',
          sector: 'Technology',
        },
      ],
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'],
      backtestResult: {
        accountId: 1,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        initialCapital: 100000,
        finalEquity: 125000,
        totalReturn: 25000,
        totalReturnPercent: 25.0,
        sharpeRatio: 1.85,
        maxDrawdown: 8500,
        maxDrawdownPercent: 8.5,
        winRate: 62.5,
        totalTrades: 24,
        winningTrades: 15,
        losingTrades: 9,
        averageWin: 2500,
        averageLoss: 1200,
        trades: [
          {
            symbol: 'AAPL',
            entryDate: '2023-01-15',
            entryPrice: 150.0,
            exitDate: '2023-02-20',
            exitPrice: 165.0,
            quantity: 100,
            profitLoss: 1500,
            returnPercent: 10.0,
          },
          {
            symbol: 'MSFT',
            entryDate: '2023-03-10',
            entryPrice: 280.0,
            exitDate: '2023-04-25',
            exitPrice: 270.0,
            quantity: 50,
            profitLoss: -500,
            returnPercent: -3.57,
          },
        ],
        dailySnapshots: Array.from({ length: 365 }, (_, i) => {
          const date = new Date('2023-01-01')
          date.setDate(date.getDate() + i)
          const equity = 100000 + i * 68.5 + Math.random() * 2000 - 1000
          return {
            date: date.toISOString().split('T')[0],
            equity: Math.round(equity * 100) / 100,
            cash: Math.round((equity * 0.3) * 100) / 100,
          }
        }),
      },
    }
    await use(mockData)
  },
})

export { expect }
