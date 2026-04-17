import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { world } from './world.js';

const apiUrl = process.env.API_URL || 'http://127.0.0.1:5024';
const { Given, When, Then } = createBdd();

const state = {
  lobbyId: '',
  players: [],
  matchEnded: false,
};

const getPlayerByName = (name) =>
  state.players.find((player) => player.name.toLowerCase() === name.toLowerCase());

Given('a game is currently running with {int} players', async ({ page }, count) => {
  const createResponse = await page.request.post(`${apiUrl}/api/lobby`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ name: 'Fatima' }),
  });
  expect(createResponse.ok()).toBe(true);
  const createData = await createResponse.json();

  state.lobbyId = createData.lobbyId;
  world.lobbyId = state.lobbyId;
  state.players = [
    { id: createData.playerId, name: 'Fatima', isHost: true, isReady: false },
  ];

  for (let i = 1; i < count; i += 1) {
    const playerName = `Player${i + 1}`;
    const joinResponse = await page.request.post(
      `${apiUrl}/api/lobby/${state.lobbyId}/join`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          name: playerName,
          characterId: 'ugglan',
          isHost: false,
        }),
      },
    );

    expect(joinResponse.ok()).toBe(true);
    const joinData = await joinResponse.json();
    state.players.push({
      id: joinData.player.id,
      name: playerName,
      isHost: false,
      isReady: false,
    });
  }

  for (const player of state.players) {
    const readyResponse = await page.request.post(
      `${apiUrl}/api/lobby/${state.lobbyId}/ready/${player.id}`,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
    expect(readyResponse.ok()).toBe(true);
    player.isReady = true;
  }

  const startResponse = await page.request.post(`${apiUrl}/api/lobby/${state.lobbyId}/start`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ gameMode: 'standard' }),
  });
  expect(startResponse.ok()).toBe(true);
});

When('player {string} submits CategoriesCompleted = true', async ({ page }, playerName) => {
  const player = getPlayerByName(playerName);
  expect(player).toBeDefined();

  const response = await page.request.post(
    `${apiUrl}/api/lobby/${state.lobbyId}/player-finished/${player.id}`,
    {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ categoriesCompleted: true }),
    },
  );
  expect(response.ok()).toBe(true);

  const responseData = await response.json();
  state.matchEnded = responseData.matchEnded === true;

  const lobbyResponse = await page.request.get(`${apiUrl}/api/lobby/${state.lobbyId}`);
  expect(lobbyResponse.ok()).toBe(true);
  const lobby = await lobbyResponse.json();
  state.players = (lobby.players || []).map((player) => ({
    ...player,
    isReady: player.isReady ?? player.IsReady,
  }));
});

Then('the match should end', async () => {
  expect(state.matchEnded).toBe(true);
});

Then('MatchEnded should be true', async () => {
  expect(state.matchEnded).toBe(true);
});

Then('all players should have IsReady = false', async () => {
  const bad = state.players.filter((player) => player.isReady !== false);
  if (bad.length > 0) {
    throw new Error(`Players not reset: ${JSON.stringify(state.players, null, 2)}`);
  }
  expect(bad.length).toBe(0);
});