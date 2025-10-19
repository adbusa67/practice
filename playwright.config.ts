import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for EventEase UI Tests
 *
 * This configuration runs E2E tests against the Next.js application
 * with a real Supabase database for complete integration testing.
 */

export default defineConfig({
  testDir: './apps/event-ease/tests/ui_e2e_playwright/tests',

  // Run tests in files in parallel
  fullyParallel: false, // Run sequentially to avoid database conflicts

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 1,

  // Reporter to use
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : 'html',

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:9000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:9000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for Next.js to start
  },
});
