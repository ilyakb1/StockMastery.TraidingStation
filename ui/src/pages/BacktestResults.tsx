import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'

export default function BacktestResults() {
  const navigate = useNavigate()

  // Get result from sessionStorage
  const storedResult = sessionStorage.getItem('latestBacktestResult')
  const result = storedResult ? JSON.parse(storedResult) : null
  const isLoading = false

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading backtest results...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          No backtest results found. Please run a backtest first.
        </p>
        <button
          onClick={() => navigate('/backtest')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Backtest
        </button>
      </div>
    )
  }

  // Calculate additional metrics
  const totalReturn = result.totalReturn || 0
  const totalReturnPercent = result.totalReturnPercent || 0
  const sharpeRatio = result.sharpeRatio || 0
  const maxDrawdown = result.maxDrawdown || 0
  const maxDrawdownPercent = result.maxDrawdownPercent || 0
  const winRate = result.winRatePercent || result.winRate || 0
  const totalTrades = result.totalTrades || 0

  // Calculate winning/losing trades from trades array
  const winningTrades = result.trades?.filter((t: any) => (t.profitLoss || 0) > 0).length || 0
  const losingTrades = result.trades?.filter((t: any) => (t.profitLoss || 0) < 0).length || 0

  // Calculate average win/loss
  const wins = result.trades?.filter((t: any) => (t.profitLoss || 0) > 0) || []
  const losses = result.trades?.filter((t: any) => (t.profitLoss || 0) < 0) || []
  const avgWin = wins.length > 0 ? wins.reduce((sum: number, t: any) => sum + (t.profitLoss || 0), 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? losses.reduce((sum: number, t: any) => sum + (t.profitLoss || 0), 0) / losses.length : 0
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0

  // Prepare equity curve data
  const equityData = (result.dailySnapshots || []).map((snapshot: { date: string; totalEquity: number; cash: number }) => ({
    date: new Date(snapshot.date).toLocaleDateString(),
    equity: snapshot.totalEquity || 0,
    cash: snapshot.cash || 0,
  }))

  // Prepare monthly returns data
  const monthlyReturnsData: { [key: string]: number } = {}
  if (result.dailySnapshots && result.dailySnapshots.length > 0) {
    result.dailySnapshots.forEach((snapshot: { date: string; totalEquity: number; cash: number }, index: number) => {
      if (index === 0) return
      const date = new Date(snapshot.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const prevEquity = result.dailySnapshots[index - 1].totalEquity || 0
      const currentEquity = snapshot.totalEquity || 0
      if (prevEquity > 0) {
        const returnPct = ((currentEquity - prevEquity) / prevEquity) * 100

        if (!monthlyReturnsData[monthKey]) {
          monthlyReturnsData[monthKey] = 0
        }
        monthlyReturnsData[monthKey] += returnPct
      }
    })
  }

  const monthlyReturnsChartData = Object.entries(monthlyReturnsData).map(
    ([month, return_]) => ({
      month,
      return: return_,
    })
  )

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/backtest')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Backtest
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Backtest Results</h1>
        <p className="mt-2 text-gray-600">
          {new Date(result.startDate).toLocaleDateString()} -{' '}
          {new Date(result.endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Return</p>
              <p
                className={`text-2xl font-bold ${
                  totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {totalReturn >= 0 ? '+' : ''}$
                {totalReturn.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {totalReturnPercent >= 0 ? '+' : ''}
                {totalReturnPercent.toFixed(2)}%
              </p>
            </div>
            {totalReturn >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Sharpe Ratio</p>
          <p className="text-2xl font-bold text-gray-900">
            {sharpeRatio.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Risk-adjusted return</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Max Drawdown</p>
          <p className="text-2xl font-bold text-red-600">
            -${maxDrawdown.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {maxDrawdownPercent.toFixed(2)}%
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Win Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {winRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {winningTrades}/{totalTrades} trades
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Total Trades</p>
          <p className="text-xl font-semibold text-gray-900">{totalTrades}</p>
          <div className="mt-2 text-sm text-gray-500">
            <span className="text-green-600">{winningTrades} wins</span> /{' '}
            <span className="text-red-600">{losingTrades} losses</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Average Win/Loss</p>
          <p className="text-xl font-semibold text-green-600">
            ${avgWin.toFixed(2)}
          </p>
          <p className="text-xl font-semibold text-red-600">
            -${Math.abs(avgLoss).toFixed(2)}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-600">Profit Factor</p>
          <p className="text-xl font-semibold text-gray-900">
            {profitFactor.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {profitFactor > 1 ? 'Profitable' : 'Unprofitable'}
          </p>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Equity Curve
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={equityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                `$${(value / 1000).toFixed(0)}k`
              }
            />
            <Tooltip
              formatter={(value: number) =>
                `$${value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Total Equity"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cash"
              stroke="#10b981"
              strokeWidth={2}
              name="Cash"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Returns Chart */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Returns
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyReturnsChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}%`}
            />
            <Bar
              dataKey="return"
              fill="#8b5cf6"
              name="Return %"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trade History Table */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Trade History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exit Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {result.trades.map((trade: { symbol: string; entryDate: string; entryPrice: number; exitDate: string; exitPrice: number; quantity: number; profitLoss: number; returnPercent: number }, index: number) => {
                const pnl = trade.profitLoss
                const returnPct = trade.returnPercent

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {trade.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(trade.entryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${trade.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.exitDate
                        ? new Date(trade.exitDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.quantity}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {pnl >= 0 ? '+' : ''}$
                      {pnl.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        returnPct >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {returnPct >= 0 ? '+' : ''}
                      {returnPct.toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
