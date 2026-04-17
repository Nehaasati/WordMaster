import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { world } from './world.js';

const apiUrl = process.env.API_URL || 'http://127.0.0.1:5024';
const { Then } = createBdd();

const getLobbyIdFromUrl = (url) => {
  try {
    const path = new URL(url).pathname;
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';
    return lastSegment === 'lobby' ? '' : lastSegment;
  } catch {
    return '';
  }
};

const stateMap = {
  0: 'WaitingForPlayers',
  1: 'WaitingForReady',
  2: 'PlayingRound',
  3: 'GameFinished',
};

const parseLobby = async (response) => {
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const fetchLobby = async (page, lobbyId) => {
  const response = await page.request.get(`${apiUrl}/api/lobby/${lobbyId}`);
  return await parseLobby(response);
};

const getActualState = (lobby) => {
  if (!lobby) return null;
  return typeof lobby.state === 'number'
    ? stateMap[lobby.state]
    : lobby.state;
};

const assertLobbyState = async (page, stateText) => {
  const lobbyId = world.lobbyId || getLobbyIdFromUrl(page.url());

  let actualState = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const lobby = await fetchLobby(page, lobbyId);
    actualState = getActualState(lobby);
    if (actualState === stateText) {
      return;
    }
    await page.waitForTimeout(300);
  }

  throw new Error(
    `Expected lobby state to be ${stateText} but got ${actualState ?? 'unavailable'}`,
  );
};

Then('the lobby should be in state {string}', async ({ page }, stateText) => {
  await assertLobbyState(page, stateText);
});

Then('the lobby state should be {string}', async ({ page }, stateText) => {
  await assertLobbyState(page, stateText);
});

Then('the lobby should contain {int} players', async ({ page }, count) => {
  const lobbyId = world.lobbyId || getLobbyIdFromUrl(page.url());

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const lobby = await fetchLobby(page, lobbyId);
    if (lobby?.players?.length === count) {
      return;
    }
    await page.waitForTimeout(300);
  }

  const lobby = await fetchLobby(page, lobbyId);
  const actualCount = lobby?.players?.length ?? 'unavailable';
  throw new Error(
    `Expected ${count} players in lobby ${lobbyId} but got ${actualCount}`,
  );
});