import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { accountsApi, stocksApi, backtestApi, BacktestRequest } from '../services/api'
import { Play, AlertCircle } from 'lucide-react'

export default function Backtest() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<BacktestRequest>({
    accountId: 0,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    symbols: [],
    strategyType: 'ma_crossover',
    shortPeriod: 20,
    longPeriod: 50,
    positionSize: 100,
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.getAll()).data,
  })

  const { data: symbols } = useQuery({
    queryKey: ['symbols'],
    queryFn: async () => (await stocksApi.getSymbols()).data,
  })

  const runBacktestMutation = useMutation({
    mutationFn: (request: BacktestRequest) => backtestApi.run(request),
    onSuccess: (response) => {
      // Store result in sessionStorage for the results page
      sessionStorage.setItem('latestBacktestResult', JSON.stringify(response.data))
      // Navigate to results page
      navigate('/backtest/results')
    },
    onError: (error: any) => {
      alert(`Error running backtest: ${error.response?.data?.error || error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runBacktestMutation.mutate(formData)
  }

  const handleSymbolToggle = (symbol: string) => {
    setFormData((prev) => ({
      ...prev,
      symbols: prev.symbols.includes(symbol)
        ? prev.symbols.filter((s) => s !== symbol)
        : [...prev.symbols, symbol],
    }))
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Run Backtest</h1>
        <p className="mt-2 text-gray-600">
          Configure and execute a backtest with historical data
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Backtest Configuration
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trading Account
            </label>
            <select
              value={formData.accountId}
              onChange={(e) =>
                setFormData({ ...formData, accountId: Number(e.target.value) })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              required
            >
              <option value={0}>Select an account</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (${account.initialCapital.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>
          </div>

          {/* Symbol Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Symbols
            </label>
            <div className="border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {symbols?.map((symbol) => (
                  <label
                    key={symbol}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.symbols.includes(symbol)}
                      onChange={() => handleSymbolToggle(symbol)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{symbol}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Strategy Parameters */}
          <div className="border-t pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              Strategy: Moving Average Crossover
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Period
                </label>
                <input
                  type="number"
                  value={formData.shortPeriod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shortPeriod: Number(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Long Period
                </label>
                <input
                  type="number"
                  value={formData.longPeriod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longPeriod: Number(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Size
                </label>
                <input
                  type="number"
                  value={formData.positionSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      positionSize: Number(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                  min={1}
                />
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  This backtest uses temporal safety to prevent future data leakage.
                  The simulation advances day-by-day and can only access historical data.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                runBacktestMutation.isPending || formData.symbols.length === 0
              }
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 mr-2" />
              {runBacktestMutation.isPending ? 'Running...' : 'Run Backtest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
