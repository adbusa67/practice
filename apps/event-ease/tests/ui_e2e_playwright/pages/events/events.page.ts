import { Page, Locator, expect } from '@playwright/test';
import { EventsPageSelectors } from '../../selectors/events/events.selectors';
import { TIMEOUTS, ROUTES } from '../../constants/events/testData';

/**
 * Events Page Object
 * Encapsulates events page interactions
 */
export class EventsPage {
  constructor(private page: Page) {}

  /**
   * Get page title element
   */
  getPageTitle(): Locator {
    return this.page.getByText(EventsPageSelectors.pageTitle);
  }

  /**
   * Get search input element
   */
  getSearchInput(): Locator {
    return this.page.locator(EventsPageSelectors.searchInput);
  }

  /**
   * Get all event cards
   */
  getEventCards(): Locator {
    return this.page.locator(EventsPageSelectors.eventCard);
  }

  /**
   * Get first event card
   */
  getFirstEventCard(): Locator {
    return this.getEventCards().first();
  }

  /**
   * Get grid container
   */
  getGridContainer(): Locator {
    return this.page.locator(EventsPageSelectors.gridContainer).first();
  }

  /**
   * Get filter button for all events
   */
  getFilterAllButton(): Locator {
    return this.page.locator(EventsPageSelectors.filterAllButton);
  }

  /**
   * Get filter button for registered events
   */
  getFilterRegisteredButton(): Locator {
    return this.page.locator(EventsPageSelectors.filterRegisteredButton);
  }

  /**
   * Get filter button for not registered events
   */
  getFilterNotRegisteredButton(): Locator {
    return this.page.locator(EventsPageSelectors.filterNotRegisteredButton);
  }

  /**
   * Wait for events to load
   */
  async waitForEventsToLoad(): Promise<void> {
    await this.page.waitForSelector(EventsPageSelectors.eventCard, {
      timeout: TIMEOUTS.DEFAULT
    });
  }

  /**
   * Wait for grid to be visible
   */
  async waitForGrid(): Promise<void> {
    await this.page.waitForSelector(EventsPageSelectors.gridContainer, {
      timeout: TIMEOUTS.DEFAULT
    });
  }

  /**
   * Search for events
   */
  async searchEvents(query: string): Promise<void> {
    await this.page.waitForSelector(EventsPageSelectors.searchInput, {
      timeout: TIMEOUTS.DEFAULT
    });
    await this.page.fill(EventsPageSelectors.searchInput, query);
  }

  /**
   * Clear search input
   */
  async clearSearch(): Promise<void> {
    await this.page.fill(EventsPageSelectors.searchInput, '');
  }

  /**
   * Click on an event card to expand it
   */
  async expandEventCard(card: Locator): Promise<void> {
    await card.click();
    await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
  }

  /**
   * Click on first event card
   */
  async expandFirstEventCard(): Promise<void> {
    const firstCard = this.getFirstEventCard();
    await this.expandEventCard(firstCard);
  }

  /**
   * Get Purchase/Register button within a card
   */
  getPurchaseOrRegisterButton(card: Locator): Locator {
    return card.getByRole(
      EventsPageSelectors.purchaseOrRegisterButton.role,
      { name: EventsPageSelectors.purchaseOrRegisterButton.name }
    );
  }

  /**
   * Get Register button within a card
   */
  getRegisterButton(card: Locator): Locator {
    return card.getByRole(
      EventsPageSelectors.registerButton.role,
      { name: EventsPageSelectors.registerButton.name }
    );
  }

  /**
   * Get Unregister/Registered button within a card
   */
  getUnregisterButton(card: Locator): Locator {
    return card.getByRole(
      EventsPageSelectors.unregisterButton.role,
      { name: EventsPageSelectors.unregisterButton.name }
    );
  }

  /**
   * Click register button on a specific event card
   */
  async clickRegisterOnCard(card: Locator): Promise<void> {
    const registerButton = this.getRegisterButton(card);

    if (await registerButton.count() > 0) {
      const isVisible = await registerButton.first().isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        const buttonText = await registerButton.first().textContent();

        if (buttonText?.toLowerCase() === 'register') {
          await registerButton.first().click();
          await this.page.waitForTimeout(TIMEOUTS.RELOAD);
        }
      }
    }
  }

  /**
   * Click unregister button on a specific event card
   */
  async clickUnregisterOnCard(card: Locator): Promise<void> {
    const unregisterButton = this.getUnregisterButton(card);

    if (await unregisterButton.count() > 0) {
      await unregisterButton.first().click();
      await this.page.waitForTimeout(TIMEOUTS.RELOAD);
    }
  }

  /**
   * Filter events by registration status
   */
  async filterByRegistrationStatus(filter: 'all' | 'registered' | 'not-registered'): Promise<void> {
    switch (filter) {
      case 'all':
        await this.getFilterAllButton().click();
        break;
      case 'registered':
        await this.getFilterRegisteredButton().click();
        break;
      case 'not-registered':
        await this.getFilterNotRegisteredButton().click();
        break;
    }
    await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
  }

  /**
   * Reload the page
   */
  async reloadPage(): Promise<void> {
    await this.page.reload();
    await this.page.waitForTimeout(TIMEOUTS.RELOAD);
  }

  /**
   * Check if page URL is correct
   */
  async verifyPageURL(): Promise<void> {
    await expect(this.page).toHaveURL(ROUTES.EVENTS);
  }

  /**
   * Verify page title is visible
   */
  async verifyPageTitleVisible(): Promise<void> {
    await expect(this.getPageTitle()).toBeVisible();
  }

  /**
   * Verify search input is visible
   */
  async verifySearchInputVisible(): Promise<void> {
    await expect(this.getSearchInput()).toBeVisible();
  }

  /**
   * Verify event cards are visible
   */
  async verifyEventCardsVisible(): Promise<void> {
    await expect(this.getFirstEventCard()).toBeVisible();
  }

  /**
   * Verify grid is visible
   */
  async verifyGridVisible(): Promise<void> {
    await expect(this.getGridContainer()).toBeVisible();
  }

  /**
   * Verify expanded card shows action buttons
   */
  async verifyExpandedCardShowsButtons(card: Locator): Promise<void> {
    await expect(
      this.getPurchaseOrRegisterButton(card)
    ).toBeVisible({ timeout: TIMEOUTS.BUTTON_VISIBILITY });
  }

  /**
   * Verify "Searching events..." text is visible
   */
  async verifySearchingStateVisible(): Promise<void> {
    await expect(
      this.page.getByText(EventsPageSelectors.searchingText)
    ).toBeVisible();
  }

  /**
   * Verify "No events found" text is visible
   */
  async verifyNoEventsTextVisible(): Promise<void> {
    await expect(
      this.page.getByText(EventsPageSelectors.noEventsText)
    ).toBeVisible();
  }

  /**
   * Verify registration button changed after registration
   */
  async verifyRegistrationButtonChanged(card: Locator): Promise<void> {
    const updatedButton = this.getUnregisterButton(card);
    if (await updatedButton.count() > 0) {
      await expect(updatedButton.first()).toBeVisible();
    }
  }

  /**
   * Count visible event cards
   */
  async countEventCards(): Promise<number> {
    return await this.getEventCards().count();
  }
}
