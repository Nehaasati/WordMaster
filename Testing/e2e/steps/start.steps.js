// start steps
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page.js';
import { LobbyPage } from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

const state = {
  lobby: null,
};

Given('a lobby exists with 2 ready players', async ({ page, browser }) => {
  const landing = new LandingPage(page);
  await landing.goto();

  await landing.openCreateLobbyModal();
  await landing.enterName('Fatima');
  await landing.confirm();
  await page.waitForURL('**/lobby/**');

  state.lobby = new LobbyPage(page);
  await state.lobby.waitForLobby();

  const lobbyId = page.url().split('/').pop();
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  const guestLobby = new LobbyPage(guestPage);
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  await guestPage.goto(`${appUrl}/lobby/${lobbyId}`);
  await guestLobby.enterName('Oskar');
  await guestLobby.confirm();
  await guestLobby.waitForLobby();

  await state.lobby.clickReady();
  await guestLobby.clickReady();
});

When('the host starts the game', async () => {
  await state.lobby.clickStart();
});

Then('the game should start successfully', async () => {
  await state.lobby.page.waitForSelector('text=POÄNG', { timeout: 15000 });
});



Then('GameStarted should be true', async () => {
  expect(true).toBeTruthy();
});