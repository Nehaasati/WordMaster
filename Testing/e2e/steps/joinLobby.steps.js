import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import LandingPage from '../pages/landing.page.js';
import LobbyPage from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

Given('att jag öppnar landningssidan', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.goto();
});

Given('en lobby är redan skapad av värden', async ({ page }) => {
  const landing = new LandingPage(page);

  await landing.goto();
  await landing.clickCreateLobby();

  // Fyll i spelarnamn för värden
  await page.getByTestId('name-input').fill('Fatima');

  // Klicka på skapa-lobby bekräfta-knappen
  await page.getByTestId('modal-create-confirm').click();

  // Spara lobbykoden i global test state så att gästen kan använda den
  const url = page.url();
  const lobbyId = url.split('/').pop();
  global.testState = { lobbyId };
});

When('jag klickar på gå-med-i-lobby knappen', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.clickJoinLobby();
});

When('jag anger spelarnamn {string}', async ({ page }, name) => {
  await page.getByTestId('name-input').fill(name);
});

When('jag anger lobbykoden från värden', async ({ page }) => {
  const lobbyCode = global.testState.lobbyId;
  await page.getByTestId('join-code-input').fill(lobbyCode);
});

When('jag klickar på join-lobby bekräfta-knappen', async ({ page }) => {
  await page.getByTestId('modal-join-confirm').click();
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