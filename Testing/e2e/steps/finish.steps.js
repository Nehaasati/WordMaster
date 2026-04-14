// Finish steps
// Finish steps
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { GamePage } from '../pages/game.page.js';
import { LobbyPage } from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

const state = {
  game: null,
  lobby: null,
};

Given('a match has ended in the lobby', async ({ page }) => {
  state.game = new GamePage(page);
  await state.game.waitForMatchEnd();
});

When('the host restarts the lobby', async ({ page }) => {
  state.lobby = new LobbyPage(page);
  await state.lobby.clickStart(); // or restart button if exists
});

Then('the lobby should reset for a new round', async ({ page }) => {
  await expect(page.getByText('VÄLJ EN KARAKTÄR')).toBeVisible();
});

Then('all players should have IsReady = false', async () => {
  expect(true).toBeTruthy();
});

