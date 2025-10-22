# About The Project

For this take-home assignment you’ll be designing a test framework for a community event management platform called EventEase. Users sign into their account where they can view and register for events. We want to ensure the code quality of new enhancements in the most efficient and least fragile way possible.  We would also like a way for developers to easily run the tests to ensure their code passes regression.

This project uses the same technologies we use everyday at MagicSchool:


- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs/reference/javascript/initializing)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Figma](https://www.figma.com/)

## Time Expectations

We anticipate that the take home will take around 3-4 hours, but it's completely fine if you need more or less time. We don't want you spending a whole day or more on the project because we respect your time and life outside of this process.  Some utilization of AI is fine, but make sure you understand and have tested the code you're committing.


## Setup

1. [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
1. [Install Supabase CLI](https://supabase.com/docs/guides/cli/getting-started?queryGroups=platform&platform=npm)
1. Start supabase locally: `npx supabase start`
1. [Install PNPM](https://pnpm.io/installation#using-npm)
1. Install project dependencies: `pnpm i`
1. Run the app for local development: `pnpm dev`

### Tech Stack

This project uses the following libraries and services

- Framework - [Next.js](https://nextjs.org)
- Authentication - [Supabase](https://supabase.com)
- Database - [Supabase](https://supabase.com)
- UI Components - [Radix UI](https://www.radix-ui.com/)
- Styling Framework - [Tailwind CSS](https://tailwindcss.com/)

### Running Services

- App - <http://localhost:9000>
- Supabase Studio - <http://localhost:58323>

### Test Users

Email: `user1@example.com`...`user10@example.com`

Password: `testtest`

## Test Portfolio

This repository contains the test suite for the EventEase platform, built using a layered testing approach inspired by the QA testing pyramid.

### Testing Types

The test suite is divided into four levels:

1. **Unit Tests (Jest)** – Isolated logic tests using mocked dependencies (no Supabase required)
2. **API Tests (Jest)** – Tests for server actions using a real Supabase instance
3. **Integration Tests (Jest)** – Full relational database testing (requires Supabase)
4. **UI End-to-End Tests (Playwright)** – Browser-based tests covering critical workflows (requires Supabase + Next.js dev server)

---

## Running Tests

### 1. Unit Tests

**No Supabase required.**

```bash
pnpm test:unit         # Run all unit tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

### 2. API Tests

**Supabase must be running.**

```bash
pnpm db:start          # Start Supabase
pnpm test:api          # Run API tests
pnpm db:stop           # Stop Supabase
```

### 3. Integration Tests

**Supabase must be running.**

```bash
pnpm db:start              # Start Supabase (if not already running)
pnpm test:integration      # Run integration tests
pnpm db:stop               # Stop Supabase
```

### 4. UI End-to-End Tests (Playwright)

**Requires Supabase and optionally the Next.js dev server.**

#### First-Time Setup

```bash
pnpm playwright:install          # Install Playwright + dependencies
# OR
pnpm playwright:install-browsers # Install only the browsers
# OR
pnpm exec playwright install     # Direct command
```

#### Run Tests

```bash
pnpm db:start              # Start Supabase
pnpm dev                   # (Optional) Start Next.js dev server in a separate terminal
```

Choose a test mode:

```bash
pnpm test:ui              # Headless mode (CI)
pnpm test:ui:headed       # Runs with visible browser
pnpm test:ui:ui           # Opens Playwright UI for debugging
pnpm test:ui:debug        # Debug mode
```

```bash
pnpm db:stop              # Stop Supabase after tests
```

---

### Additional Test Commands

```bash
pnpm db:start                    # Required for non-unit tests
pnpm test                        # Run all tests (unit + integration)
pnpm test path/to/test.ts        # Run a specific file
pnpm test events                 # Run tests matching pattern
pnpm test -t "test name"         # Run specific test or suite by name
```




---

### Test File Structure

```
apps/event-ease/tests/
├── unit/                   # Unit tests
├── api_jest/               # API tests
├── integration/            # Integration tests
└── ui_e2e_playwright/      # UI E2E tests
```

### Test Behaviors

| Test Type   | Requires Supabase | Notes                      |
|-------------|-------------------|----------------------------|
| Unit        | NO                | Fast, uses mocks           |
| API         | YES                | Tests server actions       |
| Integration | YES                | Tests DB relationships     |
| UI E2E      | YES + Dev Server   | Tests full user flows      |

**Notes:**
- `pnpm test` defaults to running only unit tests for speed
- Jest configurations isolate test types via `testMatch`
- Playwright tests use a separate `playwright.config.ts`

---

### Test Coverage Summary

| Type        | Tests | Files | Time      | Coverage                    |
|-------------|-------|-------|-----------|-----------------------------|
| Unit        | 122   | 7     | ~2s       | >85% for `/events`          |
| API         | 19    | 1     | ~1s       | High-priority APIs          |
| Integration | 30    | 5     | ~1.5s     | Business logic              |
| UI E2E      | 14    | 1     | 15–30s    | Event registration flows    |

---

### UI E2E Architecture (Playwright)

Follows the **Page Object Model (POM)** pattern.

#### Directory Structure

```
ui_e2e_playwright/
├── constants/         # Shared test data
├── selectors/         # Element locators
├── pages/             # Page Object methods
└── tests/             # Test specifications (Gherkin-style)
```

#### Architecture Layers

1. **Constants** – Shared config and data (e.g., URLs, credentials)
2. **Selectors** – Organized locators per page (Priority: ID > attribute > text > class > xpath)
3. **Pages** – Encapsulated UI actions (no assertions)
4. **Tests** – Written using Given–When–Then format

#### Example

```typescript
test('should search for events', async () => {
  await eventsPage.waitForEventsToLoad();     // Given
  await eventsPage.searchEvents('yoga');      // When
  await eventsPage.verifySearchResults();     // Then
});
```

#### Best Practices

- Use page objects and selectors
- Use constants for test data
- Follow Given–When–Then pattern
- Avoid hardcoded values
- Avoid placing selectors or logic in tests/pages

---

## Continuous Integration (CI)

Tests are automated via **GitHub Actions**.

### Workflow File

[.github/workflows/test.yml](.github/workflows/test.yml)

### CI Pipeline Overview

| Job           | Depends On    | Description                     |
|---------------|---------------|---------------------------------|
| Unit Tests    | –             | Fast logic tests with coverage  |
| Integration   | Unit          | Tests DB relationships          |
| API           | Integration   | Tests server actions            |
| UI E2E        | API           | Full UI workflows               |

### Execution Flow

```
Unit Tests
  ↓
Integration Tests
  ↓
API Tests
  ↓
UI E2E Tests
```

### Key Features

- Runs on every pull request and new commit
- Caches dependencies for faster builds
- Uploads:
  - Jest coverage reports
  - Playwright UI test reports (screenshots, videos)
- Skips downstream jobs on failure
- Ensures consistent test coverage across all layers

---

### Summary

- **Total Tests:** 185
- **Test Layers:** Unit → Integration → API → UI
- **Tools:** Jest, Playwright, Supabase, GitHub Actions
- **Approach:** Fast-feedback, isolated test scopes, layered validation


### Please complete the following required tasks

1. We have no test coverage on the /events section of the application and would like you to build it out for us.  We would like you to have as much test coverage as possible on the functionality of that page, including e2e tests as well as tests of the underlying services and helpers.  We will have three pull requests with bugs on the events page that we will run against your test suite to see if they're caught.  DON'T WORRY IF YOU DON'T CATCH THEM ALL!  Part of the panel interview will be to see how you might adjust your tests to catch anything that may have snuck through.

Pay special attention to test fragility and test speed.  In our workflow, we'd run unit tests first since they generally run faster, so in an ideal world we would catch things in the unit test step before any e2e tests run. 

2. Create pnpm command(s) to run in the package.json file that developers can use to run the test suites.  If necessary, include steps in the README to install any prerequisites to run the test suite.
3. Set up a Github workflow that runs any tests automatically when a Pull Request is opened, or write up some documentation in the README about how you would set that up.
4. Create a NEXT_STEPS.md document describing additional work that would be required to ensure critical path for this project is covered by tests.  If there is anything that you would adjust about your current approach given more time, include it here as well.

## Questions/Issues

If you run into any issues while working on the project or have any questions about the tasks or other parts of the project, feel free to email <infra@magicschool.ai>.
  
## Submission

When you’re ready to submit your work please create a new pull request with your changes. Email <infra@magicschool.ai> to let us to let us know when you’re finished.

Please have your code pulled up and running for the interview.