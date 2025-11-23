import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
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
  name: string
  market: string
  sector?: string
  lastUpdated: string
}

export interface BacktestRequest {
  accountId: number
  startDate: string
  endDate: string
  symbols: string[]
  strategyType: string
  shortPeriod?: number
  longPeriod?: number
  positionSize?: number
  stopLoss?: {
    priceThreshold?: number
    daysToHold?: number
  }
}

export interface BacktestResult {
  accountId: number
  startDate: string
  endDate: string
  initialCapital: number
  finalEquity: number
  totalReturn: number
  totalReturnPercent: number
  maxDrawdown: number
  maxDrawdownPercent: number
  sharpeRatio: number
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
  cash: number
  equity: number
}

export interface Position {
  id: number
  symbol: string
  entryDate: string
  entryPrice: number
  quantity: number
  stopLossPrice?: number
  stopLossDays?: number
  status: string
  exitDate?: string
  exitPrice?: number
  realizedPL?: number
  exitReason?: string
}

// API Functions
export const accountsApi = {
  getAll: () => api.get<Account[]>('/accounts'),
  getById: (id: number) => api.get<Account>(`/accounts/${id}`),
  create: (data: { name: string; initialCapital: number }) =>
    api.post<Account>('/accounts', data),
  getPositions: (id: number, openOnly = false) =>
    api.get<Position[]>(`/accounts/${id}/positions?openOnly=${openOnly}`),
}

export const stocksApi = {
  getAll: () => api.get<Stock[]>('/stocks'),
  getBySymbol: (symbol: string) => api.get<Stock>(`/stocks/${symbol}`),
  getSymbols: () => api.get<string[]>('/backtest/symbols'),
  importCsv: (symbol: string, market: string, fileName: string) =>
    api.post(`/stocks/${symbol}/import?market=${market}&fileName=${fileName}`),
}

export const backtestApi = {
  run: (request: BacktestRequest) =>
    api.post<BacktestResult>('/backtest/run', request),
}

export default api
