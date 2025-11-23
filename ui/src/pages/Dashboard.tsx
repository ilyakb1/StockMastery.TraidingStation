import { useQuery } from '@tanstack/react-query'
import { accountsApi, stocksApi } from '../services/api'
import { TrendingUp, DollarSign, BarChart3, Activity } from 'lucide-react'

export default function Dashboard() {
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.getAll()).data,
  })

  const { data: stocks, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => (await stocksApi.getAll()).data,
  })

  const totalCapital = accounts?.reduce(
    (sum, acc) => sum + acc.initialCapital,
    0
  )
  const totalEquity = accounts?.reduce((sum, acc) => sum + acc.currentEquity, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your trading accounts and backtesting platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Accounts"
          value={accounts?.length || 0}
          icon={<Activity className="h-6 w-6" />}
          iconColor="bg-blue-500"
          loading={accountsLoading}
        />
        <StatCard
          title="Total Capital"
          value={`$${(totalCapital || 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          iconColor="bg-green-500"
          loading={accountsLoading}
        />
        <StatCard
          title="Current Equity"
          value={`$${(totalEquity || 0).toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6" />}
          iconColor="bg-purple-500"
          loading={accountsLoading}
        />
        <StatCard
          title="Available Stocks"
          value={stocks?.length || 0}
          icon={<BarChart3 className="h-6 w-6" />}
          iconColor="bg-orange-500"
          loading={stocksLoading}
        />
      </div>

      {/* Recent Accounts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Trading Accounts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Initial Capital
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Equity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountsLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No accounts found. Create one to get started.
                  </td>
                </tr>
              ) : (
                accounts?.map((account) => {
                  const pnl = account.currentEquity - account.initialCapital
                  const pnlPercent =
                    (pnl / account.initialCapital) * 100

                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {account.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${account.initialCapital.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${account.currentEquity.toLocaleString()}
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
                        })}{' '}
                        ({pnl >= 0 ? '+' : ''}
                        {pnlPercent.toFixed(2)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            account.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  iconColor,
  loading,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  iconColor: string
  loading?: boolean
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${iconColor}`}>
            <div className="text-white">{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {loading ? '...' : value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
