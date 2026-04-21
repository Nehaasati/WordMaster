import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import GamePage from '../pages/game.page.js';

const { Given, When, Then } = createBdd();

let game;

// -------------------------
// Background
// -------------------------
Given('att spelet har startat', async ({ page }) => {
  game = new GamePage(page);

  try {
    await page.goto('/game/test-lobby');
    await game.waitForGameToLoad();
  } catch {
    console.log('Game not available');
  }
});

// -------------------------
// UI visibility
// -------------------------
Then('ska jag se timern', async () => {
  await expect(await game.getTimer()).toBeVisible();
});

Then('ska jag se min poäng', async () => {
  await expect(await game.getScore()).toBeVisible();
});

Then('ska jag se bokstäverna', async () => {
  await expect(await game.getLettersContainer()).toBeVisible();
});

Then('ska jag se kategorierna', async () => {
  await expect(await game.getCategories()).toBeVisible();
});

// -------------------------
// Writing word
// -------------------------
When('jag skriver ett giltigt ord i kategorin {string}', async ({}, cat) => {
  await game.typeWord(cat, 'HUND');
});

Then('ska ordet markeras som giltigt', async ({}, cat) => {
  await expect(await game.getFeedback(cat)).toBeVisible();
});

// -------------------------
// Letters usage
// -------------------------
When('jag skriver ett ord', async () => {
  await game.typeWord('Animal', 'KATT');
});

Then('ska använda bokstäver markeras som använda', async () => {
  await expect(await game.getUsedLetters()).not.toHaveCount(0);
});

// -------------------------
// All categories filled
// -------------------------
When('jag fyller i alla kategorier korrekt', async () => {
  const cats = ['Name','Food','Job','Land','Colour','Animal','Object'];

  for (const c of cats) {
    await game.typeWord(c, 'TEST');
  }
});

Then('ska spelet avslutas automatiskt', async () => {
  await expect(await game.getStoppedOverlay()).toBeVisible();
});

// -------------------------
// Freeze
// -------------------------
When('jag använder freeze powerup', async () => {
  await game.clickFreeze();
});

Then('ska motståndaren bli fryst', async () => {
  await expect(await game.getFreezeEffect()).toBeVisible();
});

// -------------------------
// Ink
// -------------------------
When('jag använder bläck powerup', async () => {
  await game.clickInk();
});

Then('ska en bläck-effekt visas', async () => {
  await expect(await game.getInkEffect()).toBeVisible();
});

// -------------------------
// Joker
// -------------------------
When('jag aktiverar joker', async () => {
  await game.clickJoker();
});

Then('ska en joker-bokstav visas', async () => {
  await expect(await game.getJokerLetter()).toBeVisible();
});