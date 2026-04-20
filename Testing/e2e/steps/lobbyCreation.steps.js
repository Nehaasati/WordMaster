import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import LandingPage from '../pages/landing.page.js';
import LobbyPage from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

When('jag klickar på skapa-lobby bekräfta-knappen', async ({ page }) => {
  await page.getByTestId('modal-create-confirm').click();
});

Then('jag ska se texten {string}', async ({ page }, text) => {
  await expect(page.getByText(text)).toBeVisible();
});