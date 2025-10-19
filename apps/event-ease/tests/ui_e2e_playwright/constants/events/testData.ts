/**
 * Test data constants for Events E2E tests
 */

export const TEST_USER = {
  email: 'user1@example.com',
  password: 'testtest',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  EVENTS: '/events',
} as const;

export const TIMEOUTS = {
  DEFAULT: 10000,
  ANIMATION: 500,
  RELOAD: 2000,
  BUTTON_VISIBILITY: 5000,
} as const;

export const EVENT_FILTERS = {
  ALL: 'all',
  REGISTERED: 'registered',
  NOT_REGISTERED: 'not-registered',
} as const;
