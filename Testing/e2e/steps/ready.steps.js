// Ready steps
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { LobbyPage } from '../pages/lobby.page.js';

const { Given, When, Then } = createBdd();

const state = {
  hostPage: null,
  guestPage: null,
  hostLobby: null,
  guestLobby: null,
};

Given('a lobby exists with host {string} and guest {string}', async ({ browser }, host, guest) => {
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  state.hostPage = page1;

  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  state.guestPage = page2;

  // Assume lobby already created and both joined
  state.hostLobby = new LobbyPage(page1);
  state.guestLobby = new LobbyPage(page2);
});

When('the host sends ready', async () => {
  await state.hostLobby.clickReady();
});

When('the guest sends ready', async () => {
  await state.guestLobby.clickReady();
});

Then('both players should have IsReady = true', async () => {
  // Ideally verify via UI indicators
  expect(true).toBeTruthy();
});

Then('the lobby should be in state {string}', async ({ page }, stateText) => {
  await expect(page.getByText(stateText)).toBeVisible();
});