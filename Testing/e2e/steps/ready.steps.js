// Ready steps
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page.js';
import { LobbyPage } from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

const state = {
  hostPage: null,
  guestPage: null,
  hostLobby: null,
  guestLobby: null,
  lobbyId: null,
};

Given('a lobby exists with host {string} and guest {string}', async ({ page, browser }, host, guest) => {
  const hostLanding = new LandingPage(page);
  await hostLanding.goto();
  await hostLanding.openCreateLobbyModal();
  await hostLanding.enterName(host);
  await hostLanding.confirm();
  await page.waitForURL('**/lobby/**');
  state.lobbyId = page.url().split('/').pop();

  state.hostPage = page;
  state.hostLobby = new LobbyPage(page);
  await state.hostLobby.waitForLobby();

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  state.guestPage = guestPage;
  state.guestLobby = new LobbyPage(guestPage);
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  await guestPage.goto(`${appUrl}/lobby/${state.lobbyId}`);
  await state.guestLobby.enterName(guest);
  await state.guestLobby.confirm();
  await state.guestLobby.waitForLobby();
});

When('the host sends ready', async () => {
  await state.hostLobby.clickReady();
});

When('the guest sends ready', async () => {
  await state.guestLobby.clickReady();
});

Then('both players should have IsReady = true', async () => {
  const apiUrl = process.env.API_URL || 'http://127.0.0.1:5024';
  const response = await state.hostPage.request.get(
    `${apiUrl}/api/lobby/${state.lobbyId}`,
  );
  const lobby = await response.json();
  expect(lobby.players.length).toBe(2);
  expect(lobby.players.every((p) => p.isReady)).toBe(true);
  await state.hostPage.waitForSelector('.player-box:has-text("Ja")', { timeout: 15000 });
});

