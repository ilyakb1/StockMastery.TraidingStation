import { chromium, FullConfig } from '@playwright/test'
import axios from 'axios'

/**
 * Global setup for E2E tests
 *
 * This runs once before all tests and:
 * 1. Waits for services to be healthy
 * 2. Seeds the database with test data
 * 3. Verifies API is responding
 */
async function globalSetup(config: FullConfig) {
  const apiUrl = process.env.API_URL || 'http://localhost:5000'
  const uiUrl = process.env.UI_URL || 'http://localhost:3000'

  console.log('🚀 Starting global setup for E2E tests...')
  console.log(`API URL: ${apiUrl}`)
  console.log(`UI URL: ${uiUrl}`)

  // Wait for services to be healthy
  await waitForService(apiUrl, '/health', 'API')
  await waitForService(uiUrl, '/', 'UI')

  // Seed test data
  await seedTestData(apiUrl)

  console.log('✅ Global setup complete!')
}

/**
 * Wait for a service to be healthy
 */
async function waitForService(baseUrl: string, healthPath: string, serviceName: string) {
  const maxAttempts = 60
  const delayMs = 2000

  console.log(`⏳ Waiting for ${serviceName} to be ready...`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${baseUrl}${healthPath}`, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status
      })

      if (response.status === 200) {
        console.log(`✅ ${serviceName} is ready!`)
        return
      }

      console.log(`⏳ ${serviceName} not ready (attempt ${attempt}/${maxAttempts}, status: ${response.status})`)
    } catch (error) {
      console.log(`⏳ ${serviceName} not ready (attempt ${attempt}/${maxAttempts})`)
    }

    if (attempt < maxAttempts) {
      await sleep(delayMs)
    }
  }

  throw new Error(`❌ ${serviceName} did not become ready after ${maxAttempts} attempts`)
}

/**
 * Seed test data into the database
 */
async function seedTestData(apiUrl: string) {
  console.log('🌱 Seeding test data...')

  try {
    // Create test accounts
    const testAccounts = [
      {
        name: 'Test Account 1',
        initialCapital: 100000,
        currentCash: 100000,
      },
      {
        name: 'Test Account 2',
        initialCapital: 50000,
        currentCash: 50000,
      },
    ]

    for (const account of testAccounts) {
      try {
        await axios.post(`${apiUrl}/api/accounts`, account, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        })
        console.log(`✅ Created account: ${account.name}`)
      } catch (error: any) {
        if (error.response?.status === 409) {
          console.log(`ℹ️  Account already exists: ${account.name}`)
        } else {
          console.warn(`⚠️  Failed to create account: ${account.name}`, error.message)
        }
      }
    }

    // Add test stocks (if endpoint exists)
    const testStocks = [
      { symbol: 'AAPL', market: 'US', name: 'Apple Inc.', sector: 'Technology' },
      { symbol: 'MSFT', market: 'US', name: 'Microsoft Corporation', sector: 'Technology' },
      { symbol: 'GOOGL', market: 'US', name: 'Alphabet Inc.', sector: 'Technology' },
    ]

    for (const stock of testStocks) {
      try {
        await axios.post(`${apiUrl}/api/stocks`, stock, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        })
        console.log(`✅ Created stock: ${stock.symbol}`)
      } catch (error: any) {
        if (error.response?.status === 409 || error.response?.status === 404) {
          console.log(`ℹ️  Stock endpoint not available or stock exists: ${stock.symbol}`)
        } else {
          console.warn(`⚠️  Failed to create stock: ${stock.symbol}`, error.message)
        }
      }
    }

    console.log('✅ Test data seeding complete!')
  } catch (error: any) {
    console.warn('⚠️  Test data seeding encountered errors:', error.message)
    // Don't fail setup if seeding fails - tests might seed their own data
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default globalSetup
