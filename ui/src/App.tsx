import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Wallet } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Backtest from './pages/Backtest'
import Accounts from './pages/Accounts'
import BacktestResults from './pages/BacktestResults'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <BarChart3 className="h-8 w-8 text-primary-600" />
                    <span className="ml-2 text-xl font-bold text-gray-900">
                      Trading Station
                    </span>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link
                      to="/"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-primary-500"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Dashboard
                    </Link>
                    <Link
                      to="/backtest"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Run Backtest
                    </Link>
                    <Link
                      to="/accounts"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent"
                    >
                      <Wallet className="h-4 w-4 mr-1" />
                      Accounts
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/backtest" element={<Backtest />} />
              <Route path="/backtest/results" element={<BacktestResults />} />
              <Route path="/accounts" element={<Accounts />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App
