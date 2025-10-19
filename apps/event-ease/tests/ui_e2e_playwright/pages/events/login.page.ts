import { Page } from '@playwright/test';
import { LoginPageSelectors } from '../../selectors/events/events.selectors';
import { ROUTES, TEST_USER } from '../../constants/events/testData';

/**
 * Login Page Object
 * Encapsulates login page interactions
 */
export class LoginPage {
  constructor(private page: Page) {}

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.page.goto(ROUTES.LOGIN);
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string): Promise<void> {
    await this.page.fill(LoginPageSelectors.emailInput, email);
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string): Promise<void> {
    await this.page.fill(LoginPageSelectors.passwordInput, password);
  }

  /**
   * Click submit button
   */
  async clickSubmit(): Promise<void> {
    await this.page.click(LoginPageSelectors.submitButton);
  }

  /**
   * Wait for navigation to events page after login
   */
  async waitForEventsPage(): Promise<void> {
    await this.page.waitForURL(ROUTES.EVENTS);
  }

  /**
   * Complete login flow with test user credentials
   */
  async loginWithTestUser(): Promise<void> {
    await this.navigate();
    await this.fillEmail(TEST_USER.email);
    await this.fillPassword(TEST_USER.password);
    await this.clickSubmit();
    await this.waitForEventsPage();
  }

  /**
   * Complete login flow with custom credentials
   */
  async login(email: string, password: string): Promise<void> {
    await this.navigate();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
    await this.waitForEventsPage();
  }
}
