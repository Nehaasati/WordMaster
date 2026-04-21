import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import LobbyPage from '../pages/lobby.page.js';
import LandingPage from '../pages/landing.page.js';

const { Given, When, Then } = createBdd();

let hostPage;
let guestPage;
let lobbyCode;

Given('att värden skapar en lobby', async ({ browser }) => {
  const context = await browser.newContext();
  hostPage = await context.newPage();

  const landing = new LandingPage(hostPage);
  await landing.goto();

  await landing.clickCreateLobby();
  await hostPage.getByTestId('name-input').fill('Host');
  await hostPage.getByTestId('modal-create-confirm').click();

  const lobby = new LobbyPage(hostPage);
  await lobby.waitForLobbyToLoad();

  lobbyCode = await lobby.getLobbyCode();
});

Given('en gäst går med via kod', async ({ browser }) => {
  const context = await browser.newContext();
  guestPage = await context.newPage();

  const landing = new LandingPage(guestPage);
  await landing.goto();

  await guestPage.getByTestId('input-join-code').fill(lobbyCode);
  await guestPage.getByTestId('name-input').fill('Guest');
  await guestPage.getByTestId('btn-join-lobby').click();
});

When('båda spelarna är redo', async () => {
  const hostLobby = new LobbyPage(hostPage);
  const guestLobby = new LobbyPage(guestPage);

  await hostLobby.clickReady();
  await guestLobby.clickReady();
});

When('värden startar spelet', async () => {
  const lobby = new LobbyPage(hostPage);
  await lobby.startGame();
});

Then('ska spelet börja', async () => {
  await expect(hostPage.getByTestId('game-page')).toBeVisible();
  await expect(guestPage.getByTestId('game-page')).toBeVisible();
});

When('spelet avslutas', async () => {
  await hostPage.getByTestId('btn-finish').click();
});

Then('ska resultatsidan visas', async () => {
  await expect(hostPage.getByTestId('result-page')).toBeVisible();
});

When('spelarna väljer att spela igen', async () => {
  await hostPage.getByTestId('btn-restart-vote').click();
  await guestPage.getByTestId('btn-restart-vote').click();
});

Then('ska de återvända till samma lobby', async () => {
  await expect(hostPage.getByTestId('lobby-page')).toBeVisible();
  await expect(guestPage.getByTestId('lobby-page')).toBeVisible();
});