import { FullConfig } from '@playwright/test'

/**
 * Global teardown for E2E tests
 *
 * This runs once after all tests complete.
 * Can be used for cleanup if needed.
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global teardown...')

  // Cleanup operations can go here
  // For Docker environments, containers will be stopped by docker-compose
  // Database data will persist in volumes for debugging

  console.log('✅ Global teardown complete!')
}

export default globalTeardown
