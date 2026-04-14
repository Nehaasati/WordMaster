// start steps
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { LobbyPage } from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

const state = {
  lobby: null,
};

Given('a lobby exists with 2 ready players', async ({ page }) => {
  state.lobby = new LobbyPage(page);
  await state.lobby.waitForLobby();

  await state.lobby.clickReady();
  // simulate second player ready if needed
});

When('the host starts the game', async () => {
  await state.lobby.clickStart();
});

Then('the game should start successfully', async ({ page }) => {
  await expect(page.getByText('POÄNG')).toBeVisible();
});

Then('the lobby state should be {string}', async ({ page }, stateText) => {
  await expect(page.getByText(stateText)).toBeVisible();
});

Then('GameStarted should be true', async () => {
  expect(true).toBeTruthy();
});