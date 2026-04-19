import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import GamePage from '../pages/game.page.js';

const { Given, When, Then } = createBdd();

Given('att spelet är startat', async ({ page }) => {
  const game = new GamePage(page);
  await game.waitForGameToLoad();
});

Then('ska jag se timern', async ({ page }) => {
  await expect(page.getByTestId('timer')).toBeVisible();
});

Then('ska jag se poängen', async ({ page }) => {
  await expect(page.getByTestId('score')).toBeVisible();
});

Then('ska jag se kategorierna', async ({ page }) => {
  await expect(page.getByTestId('categories')).toBeVisible();
});

Then('ska jag se bokstäverna', async ({ page }) => {
  await expect(page.getByTestId('letters')).toBeVisible();
});

When('jag skriver {string} i kategori {string}', async ({ page }, word, cat) => {
  await page.getByTestId(`input-${cat}`).fill(word);
});

Then('ska feedback visas för kategori {string}', async ({ page }, cat) => {
  await expect(page.getByTestId(`feedback-${cat}`)).toBeVisible();
});

When('jag klickar på freeze-knappen', async ({ page }) => {
  await page.getByTestId('btn-freeze').click();
});

Then('ska freeze-meddelandet visas', async ({ page }) => {
  await expect(page.getByTestId('freeze-msg')).not.toBeEmpty();
});

When('jag klickar på mix-knappen', async ({ page }) => {
  await page.getByTestId('btn-mix').click();
});

Then('ska bokstäverna blandas', async ({ page }) => {
  const before = await page.locator('[data-testid="letter-tile"]').allTextContents();
  await page.getByTestId('btn-mix').click();
  const after = await page.locator('[data-testid="letter-tile"]').allTextContents();
  expect(before.join('')).not.toBe(after.join(''));
});

When('jag klickar på ink-knappen', async ({ page }) => {
  await page.getByTestId('btn-black').click();
});

Then('ska bläck-animationen visas', async ({ page }) => {
  await expect(page.getByTestId('ink-animation')).toBeVisible();
});

When('jag klickar på avsluta-knappen', async ({ page }) => {
  await page.getByTestId('btn-finish').click();
});

Then('ska stopp-overlay visas', async ({ page }) => {
  await expect(page.getByTestId('stopped-overlay')).toBeVisible();
});

Given('att jag är värden', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('isHost', 'true'));
});

When('jag klickar på starta-ny-runda-knappen', async ({ page }) => {
  await page.getByTestId('btn-restart').click();
});

Then('ska en ny runda startas', async ({ page }) => {
  await expect(page.getByTestId('timer')).toBeVisible();
});