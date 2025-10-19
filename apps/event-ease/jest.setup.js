import '@testing-library/jest-dom';

// Mock Next.js router - optimized for speed
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link - optimized
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

// Suppress console noise in tests for cleaner output
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Filter out known noise in test output
console.error = jest.fn((...args) => {
  const errorMessage = typeof args[0] === 'string' ? args[0] : '';
  if (
    errorMessage.includes('Warning:') ||
    errorMessage.includes('SearchEvents:') ||
    errorMessage.includes('Registration') ||
    errorMessage.includes('not wrapped in act')
  ) {
    return; // Suppress
  }
  originalError(...args);
});

console.warn = jest.fn();
console.log = jest.fn(); // Suppress all console.log in tests
