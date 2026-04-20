import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import LandingPage from '../pages/landing.page.js';
import LobbyPage from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

When('jag klickar på skapa-lobby knappen', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.clickCreateLobby();
});

When('jag anger spelarnamn {string}', async ({ page }, name) => {
  await page.getByTestId('name-input').fill(name);
});

When('jag klickar på skapa-lobby bekräfta-knappen', async ({ page }) => {
  await page.getByTestId('modal-create-confirm').click();
});

Then('ska jag omdirigeras till lobbyn', async ({ page }) => {
  await expect(page).toHaveURL(/\/lobby\/.+/);
});

Then('jag ska se texten {string}', async ({ page }, text) => {
  await expect(page.getByText(text)).toBeVisible();
});

Then('jag ska se spelaren {string} som värd', async ({ page }, name) => {
  const lobby = new LobbyPage(page);
  await expect(lobby.getPlayerName(name)).toBeVisible();
  await expect(lobby.getHostBadge(name)).toBeVisible();
});