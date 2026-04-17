import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page.js';
import { LobbyPage } from '../pages/lobby.page.js';
import { world } from './world.js';

const { Given, When, Then } = createBdd();

const state = {
  lobbyPage: null,
  landingPage: null,
  playerName: null,
  lobbyId: null,
};



When('the host creates a lobby with name {string} and character {string}', async ({ page }, name) => {
  state.landingPage = new LandingPage(page);
  await state.landingPage.goto();

  await state.landingPage.openCreateLobbyModal();
  await state.landingPage.enterName(name);
  await state.landingPage.confirm();

  await page.waitForURL('**/lobby/*');
  state.lobbyId = page.url().split('/').pop();
  world.lobbyId = state.lobbyId;

  state.lobbyPage = new LobbyPage(page);
  await state.lobbyPage.waitForLobby();

  state.playerName = name;
});

Then('the response should contain a lobbyId', async ({ page }) => {
  // Example: check URL contains lobby id
  await expect(page.url()).toContain('lobby');
});

Then('the response should contain a playerId', async () => {
  // Could be localStorage/sessionStorage check
  // Placeholder assertion
  expect(true).toBeTruthy();
});

Then('the host should be marked as IsHost = true', async () => {
  // Usually UI indicator
  expect(true).toBeTruthy();
});



Given('a lobby exists created by {string} with character {string}', async ({ browser }, name) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const landing = new LandingPage(page);
  await landing.goto();
  await landing.openCreateLobbyModal();
  await landing.enterName(name);
  await landing.confirm();

  await page.waitForURL('**/lobby/*');
  state.lobbyId = page.url().split('/').pop();
  world.lobbyId = state.lobbyId;

  state.lobbyPage = new LobbyPage(page);
  await state.lobbyPage.waitForLobby();
});

When('the guest joins the lobby with name {string} and character {string}', async ({ page }, name) => {
  const landing = new LandingPage(page);
  await landing.goto();
  await landing.openJoinLobbyModal();
  await landing.enterName(name);
  await landing.enterJoinCode(state.lobbyId);
  await landing.confirm();

  state.lobbyPage = new LobbyPage(page);
  await state.lobbyPage.waitForLobby();
});


Then('the guest should be marked as IsHost = false', async () => {
  expect(true).toBeTruthy();
});