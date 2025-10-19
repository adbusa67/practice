/**
 * Selectors for Events page
 * Priority: ID > attribute name > text > class name > xpath
 */

export const EventsPageSelectors = {
  // Page title
  pageTitle: 'Community Events',

  // Search
  searchInput: 'input[name="search"]',

  // Event cards
  eventCard: '[class*="bg-blue-50"]',

  // Filters
  registrationFilter: '[data-testid="registration-filter"]',
  filterAllButton: '[data-testid="filter-all"]',
  filterRegisteredButton: '[data-testid="filter-registered"]',
  filterNotRegisteredButton: '[data-testid="filter-not-registered"]',

  // Grid layout
  gridContainer: '[class*="grid"]',

  // Loading states
  searchingText: 'Searching events...',

  // Empty states
  noEventsText: 'No events found',

  // Buttons (by role with regex)
  purchaseOrRegisterButton: { role: 'button', name: /purchase|register/i },
  registerButton: { role: 'button', name: /register/i },
  unregisterButton: { role: 'button', name: /unregister|registered/i },
} as const;

export const LoginPageSelectors = {
  emailInput: 'input[name="email"]',
  passwordInput: 'input[name="password"]',
  submitButton: 'button[type="submit"]',
} as const;
