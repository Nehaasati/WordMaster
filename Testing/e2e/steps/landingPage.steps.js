import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import LandingPage from '../pages/landing.page.js';
import LobbyPage from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();


Given('att jag öppnar landningssidan', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.goto();
});

Then('ska jag se knappen {string}', async ({ page }, buttonText) => {
  await expect(page.getByRole('button', { name: buttonText })).toBeVisible();
});

When('jag klickar på skapa-lobby knappen', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.clickCreateLobby();
});

When('jag klickar på gå-med-i-lobby knappen', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.clickJoinLobby();
});

When('jag anger spelarnamn {string}', async ({ page }, name) => {
  await page.getByTestId('name-input').fill(name);
});

Then('ska jag omdirigeras till lobbyn', async ({ page }) => {
  await expect(page).toHaveURL(/\/lobby\/.+/);
});

Then('jag ska se spelaren {string} som värd', async ({ page }, name) => {
  const lobby = new LobbyPage(page);
  await expect(lobby.getPlayerName(name)).toBeVisible();
  await expect(lobby.getHostBadge(name)).toBeVisible();
});

Then('jag ska se spelaren {string} som gäst', async ({ page }, name) => {
  const lobby = new LobbyPage(page);
  await expect(lobby.getPlayerName(name)).toBeVisible();
});

Then('ska skapa-lobby modalen visas', async ({ page }) => {
  await expect(page.getByTestId('modal-create-confirm')).toBeVisible();
});

Then('ska join-lobby modalen visas', async ({ page }) => {
  await expect(page.getByTestId('modal-join-confirm')).toBeVisible();
});