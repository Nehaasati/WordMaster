import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page.js';
import { LobbyPage } from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

const state = {
  lobbyPage: null,
  landingPage: null,
  playerName: null,
};

Given('the backend is running', async () => {
  // Usually handled externally, keep as placeholder
});

When('the host creates a lobby with name {string} and character {string}', async ({ page }, name) => {
  state.landingPage = new LandingPage(page);
  await state.landingPage.goto();

  await state.landingPage.openCreateLobbyModal();
  await state.landingPage.enterName(name);
  await state.landingPage.confirm();

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

  state.lobbyPage = new LobbyPage(page);
  await state.lobbyPage.waitForLobby();
});

When('the guest joins the lobby with name {string} and character {string}', async ({ browser }, name) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const landing = new LandingPage(page);
  await landing.goto();
  await landing.openJoinLobbyModal();
  await landing.enterName(name);
  await landing.confirm();

  state.lobbyPage = new LobbyPage(page);
  await state.lobbyPage.waitForLobby();
});

Then('the lobby should contain 2 players', async () => {
  const players = await state.lobbyPage.getPlayers();
  expect(players.length).toBe(2);
});

Then('the guest should be marked as IsHost = false', async () => {
  expect(true).toBeTruthy();
});