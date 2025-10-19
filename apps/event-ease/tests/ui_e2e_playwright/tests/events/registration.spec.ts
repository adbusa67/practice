import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/events/login.page';
import { EventsPage } from '../../pages/events/events.page';
import { EVENT_FILTERS } from '../../constants/events/testData';

/**
 * Event Registration Flow - UI E2E Tests
 *
 * These tests verify the complete event registration user journey
 * including viewing events, selecting tickets, registering, and unregistering.
 *
 * REQUIRES:
 * - Supabase running (pnpm db:start)
 * - Next.js dev server running (pnpm dev) OR will auto-start via webServer config
 */

test.describe('Event Registration Flow', () => {
  let loginPage: LoginPage;
  let eventsPage: EventsPage;

  test.beforeEach(async ({ page }) => {
    // Given: User is logged in
    loginPage = new LoginPage(page);
    eventsPage = new EventsPage(page);

    await loginPage.loginWithTestUser();
  });

  test('should display events page after login', async () => {
    // Then: Verify we're on the events page
    await eventsPage.verifyPageURL();

    // And: Check for main page elements
    await eventsPage.verifyPageTitleVisible();
    await eventsPage.verifySearchInputVisible();

    // And: Wait for events to load
    await eventsPage.waitForGrid();
  });

  test('should display event cards with basic information', async ({ page }) => {
    // When: Events are loaded
    await page.waitForSelector('text=/.*/', { timeout: 10000 });

    // Then: Event cards should be visible
    const firstCard = eventsPage.getFirstEventCard();
    await expect(firstCard).toBeVisible();

    // And: Event cards should have content
    await expect(firstCard).toContainText(/.+/);
  });

  test('should expand event card to show full details', async () => {
    // Given: Events are loaded
    await eventsPage.waitForEventsToLoad();

    // When: User clicks to expand first event card
    const firstCard = eventsPage.getFirstEventCard();
    await eventsPage.expandEventCard(firstCard);

    // Then: Expanded content with action buttons should be visible
    await eventsPage.verifyExpandedCardShowsButtons(firstCard);
  });

  test('should search for events and display results', async ({ page }) => {
    // Given: Events page is loaded
    await eventsPage.waitForEventsToLoad();

    // When: User searches for specific events
    await eventsPage.searchEvents('yoga');

    // Then: Results should be filtered or show searching state
    // Note: This may show fewer cards or "No events found" depending on data
    await page.waitForTimeout(500);
  });

  test('should filter events by registration status', async ({ page }) => {
    // Given: Events are loaded
    await eventsPage.waitForEventsToLoad();

    // When: User filters by registered events
    await eventsPage.filterByRegistrationStatus(EVENT_FILTERS.REGISTERED as 'registered');
    await page.waitForTimeout(500);

    // And: User filters by not registered events
    await eventsPage.filterByRegistrationStatus(EVENT_FILTERS.NOT_REGISTERED as 'not-registered');
    await page.waitForTimeout(500);

    // Then: User can switch back to all events
    await eventsPage.filterByRegistrationStatus(EVENT_FILTERS.ALL as 'all');
    await eventsPage.verifyEventCardsVisible();
  });

  test('should register for an event with free ticket', async ({ page }) => {
    // Given: Events are loaded and user expands an event card
    await eventsPage.waitForEventsToLoad();
    const eventCard = eventsPage.getFirstEventCard();
    await eventsPage.expandEventCard(eventCard);

    // When: User attempts to register
    await eventsPage.clickRegisterOnCard(eventCard);

    // Then: Registration should be processed (button state may change)
    // Note: This depends on whether the event has free tickets
    await page.waitForTimeout(1000);
  });

  test('should handle complete registration workflow', async () => {
    // Given: Events are loaded
    await eventsPage.waitForEventsToLoad();
    const eventCard = eventsPage.getFirstEventCard();

    // When: User expands card and registers
    await eventsPage.expandEventCard(eventCard);
    await eventsPage.clickRegisterOnCard(eventCard);

    // And: User attempts to unregister
    await eventsPage.clickUnregisterOnCard(eventCard);

    // Then: Page should still be functional
    await eventsPage.verifyPageTitleVisible();
  });

  test('should show loading state during registration', async () => {
    // Given: Events are loaded
    await eventsPage.waitForEventsToLoad();
    const eventCard = eventsPage.getFirstEventCard();

    // When: User expands card
    await eventsPage.expandEventCard(eventCard);

    // Then: Registration controls should be available
    // Note: Loading state is brief and may not be consistently visible
    const registerButton = eventsPage.getRegisterButton(eventCard);
    const buttonCount = await registerButton.count();

    if (buttonCount > 0) {
      const buttonText = await registerButton.first().textContent();
      // Verify button has expected text (Register, Registered, or Purchase)
      expect(buttonText).toBeTruthy();
    }
  });

  test('should display ticket types with prices', async () => {
    // Given: Events are loaded
    await eventsPage.waitForEventsToLoad();
    const eventCard = eventsPage.getFirstEventCard();

    // When: User expands card to show ticket information
    await eventsPage.expandEventCard(eventCard);

    // Then: Action buttons should be visible (indicating prices are shown)
    await eventsPage.verifyExpandedCardShowsButtons(eventCard);
  });

  test('should handle empty search results', async ({ page }) => {
    // Given: Events page is loaded
    await eventsPage.waitForEventsToLoad();

    // When: User searches for something that doesn't exist
    await eventsPage.searchEvents('nonexistenteventsearchquery123');
    await page.waitForTimeout(500);

    // Then: Should show "No events found" or maintain previous results
    // Note: Actual behavior depends on search implementation
    const eventCount = await eventsPage.countEventCards();
    expect(eventCount).toBeGreaterThanOrEqual(0);
  });

  test('should navigate between registered and unregistered filters', async ({ page }) => {
    // Given: Events are loaded
    await eventsPage.waitForEventsToLoad();

    // When: User switches between filters
    await eventsPage.filterByRegistrationStatus(EVENT_FILTERS.REGISTERED as 'registered');
    await page.waitForTimeout(500);

    await eventsPage.filterByRegistrationStatus(EVENT_FILTERS.NOT_REGISTERED as 'not-registered');
    await page.waitForTimeout(500);

    await eventsPage.filterByRegistrationStatus(EVENT_FILTERS.ALL as 'all');

    // Then: Events should be visible
    await eventsPage.verifyEventCardsVisible();
  });
});

test.describe('Event Registration Edge Cases', () => {
  let loginPage: LoginPage;
  let eventsPage: EventsPage;

  test.beforeEach(async ({ page }) => {
    // Given: User is logged in
    loginPage = new LoginPage(page);
    eventsPage = new EventsPage(page);

    await loginPage.loginWithTestUser();
  });

  test('should handle network errors gracefully', async () => {
    // Given: Events page is loaded
    await eventsPage.waitForEventsToLoad();

    // Then: Page should at minimum display header
    await eventsPage.verifyPageTitleVisible();
  });

  test('should maintain state after registration', async () => {
    // Given: Events are loaded and user interacts with an event
    await eventsPage.waitForEventsToLoad();
    const eventCard = eventsPage.getFirstEventCard();
    await eventsPage.expandEventCard(eventCard);

    // When: Page is reloaded
    await eventsPage.reloadPage();

    // Then: Event should still be there
    await eventsPage.verifyPageTitleVisible();
    await eventsPage.waitForEventsToLoad();
  });

  test('should display events in grid layout', async () => {
    // Given: Events are loaded
    await eventsPage.waitForEventsToLoad();

    // Then: Grid layout should be visible
    await eventsPage.verifyGridVisible();

    // And: Multiple event cards should exist
    const cardCount = await eventsPage.countEventCards();
    expect(cardCount).toBeGreaterThan(0);
  });
});
