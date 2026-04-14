import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { LandingPage } from '../pages/landing.page.js';

const apiUrl = process.env.API_URL || 'http://127.0.0.1:5024';
const { Given, When, Then } = createBdd();

let lobbyId = null;
let hostId = null;

// --------------------
// GIVEN
// --------------------

Given('a match has ended in the lobby', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.goto();
  await landing.openCreateLobbyModal();
  await landing.enterName('Fatima');
  await landing.confirm();
  await page.waitForURL('**/lobby/**');

  lobbyId = page.url().split('/').pop();

  const lobbyResponse = await page.request.get(
    `${apiUrl}/api/lobby/${lobbyId}`,
  );
  const lobbyData = await lobbyResponse.json();
  const hostPlayer = lobbyData.players.find((p) => p.isHost);
  if (!hostPlayer) throw new Error('Host player not found');
  hostId = hostPlayer.id;

  const joinResponse = await page.request.post(
    `${apiUrl}/api/lobby/${lobbyId}/join`,
    {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        name: 'Oskar',
        characterId: 'leopard',
        isHost: false,
      }),
    },
  );
  const joinData = await joinResponse.json();
  const guestId = joinData.player?.id;

  await page.request.post(
    `${apiUrl}/api/lobby/${lobbyId}/ready/${hostId}`,
    { headers: { 'Content-Type': 'application/json' }, data: '{}' },
  );
  if (guestId) {
    await page.request.post(
      `${apiUrl}/api/lobby/${lobbyId}/ready/${guestId}`,
      { headers: { 'Content-Type': 'application/json' }, data: '{}' },
    );
  }

  await page.request.post(
    `${apiUrl}/api/lobby/${lobbyId}/start`,
    {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ gameMode: 'standard' }),
    },
  );

  if (guestId) {
    await page.request.post(
      `${apiUrl}/api/lobby/${lobbyId}/player-finished/${guestId}`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ categoriesCompleted: true, score: 0 }),
      },
    );
  }

  await page.request.post(
    `${apiUrl}/api/lobby/${lobbyId}/player-finished/${hostId}`,
    {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ categoriesCompleted: true, score: 0 }),
    },
  );
});

// --------------------
// WHEN
// --------------------

When('the host restarts the lobby', async ({ page }) => {
  await page.request.post(
    `${apiUrl}/api/lobby/${lobbyId}/restart?playerId=${hostId}`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
  await page.reload();
});

// --------------------
// THEN
// --------------------

Then('the lobby should reset for a new round', async ({ page }) => {
  const segment = page.url().split('/').pop();
  const lobbyId = segment || '';
  const response = await page.request.get(
    `${apiUrl}/api/lobby/${lobbyId}`,
  );
  const lobby = await response.json();

  const stateMap = {
    0: 'WaitingForPlayers',
    1: 'WaitingForReady',
    2: 'PlayingRound',
    3: 'GameFinished',
  };

  const actualState =
    typeof lobby.state === 'number' ? stateMap[lobby.state] : lobby.state;

  expect(actualState).toBe('WaitingForReady');
});