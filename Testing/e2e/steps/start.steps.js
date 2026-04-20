import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import LobbyPage from '../pages/lobby.page.js';
import GamePage from '../pages/game.page.js';

const { When, Then } = createBdd();

When('värden klickar på "Starta spelet"', async () => {
  const hostLobby = new LobbyPage(global.testState.hostPage);
  await hostLobby.clickStart();
});

Then('spelet ska starta', async () => {
  const hostGame = new GamePage(global.testState.hostPage);
  const guestGame = new GamePage(global.testState.guestPage);

  await hostGame.waitForGameStart();
  await guestGame.waitForGameStart();
});

Then('jag ska se spelsidan med kategorier', async ({ page }) => {
  await expect(page.getByText('NAMN')).toBeVisible();
  await expect(page.getByText('MAT')).toBeVisible();
  await expect(page.getByText('JOBB')).toBeVisible();
});

Then('jag ska se tidtagare och poäng', async ({ page }) => {
  await expect(page.getByText('TID')).toBeVisible();
  await expect(page.getByText('POÄNG')).toBeVisible();
});

Then('GameStarted ska vara true', async () => {
  const response = await state.hostPage.request.get(`/api/lobby/${state.lobbyId}`);
  const lobbyData = await response.json();
  expect(lobbyData.gameStarted).toBe(true);
});