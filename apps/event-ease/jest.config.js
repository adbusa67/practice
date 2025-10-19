const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // Look for tests in both src and tests directories
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.[jt]s?(x)',
    '<rootDir>/src/**/__tests__/**/*.test.[jt]s?(x)',
    '<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // Exclude integration and UI tests by default
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/integration/',
    '/tests/api_jest/',
    '/tests/ui_e2e_playwright/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@event-ease/ui$': '<rootDir>/../../packages/ui/src/index.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
  ],
  // Performance & Stability Optimizations
  maxWorkers: '50%', // Use half CPU cores for parallel execution
  testTimeout: 10000, // 10s timeout to catch hanging tests
  clearMocks: true, // Auto-clear mocks between tests (reduces fragility)
  resetMocks: false, // Don't reset mock implementations (faster)
  restoreMocks: false, // Don't restore original implementations (faster)
}

module.exports = createJestConfig(customJestConfig)
