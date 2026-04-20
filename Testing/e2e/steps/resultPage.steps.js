import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import ResultPage from '../pages/result.page.js';

const { Given, When, Then } = createBdd();

Given('att jag är på resultatsidan', async ({ page }) => {
  // For testing purposes, navigate directly to results page
  await page.goto('/result/test-game');
  await page.waitForTimeout(1000); // Give time for page to load
});

Then('ska jag se resultat-titeln', async ({ page }) => {
  await expect(page.getByTestId('result-title')).toBeVisible();
});

Then('ska jag se scoreboarden', async ({ page }) => {
  await expect(page.getByTestId('scoreboard')).toBeVisible();
});

Then('ska vinnarrutan visas', async ({ page }) => {
  await expect(page.getByTestId('winner-box')).toBeVisible();
});

Given('att resultatet är oavgjort', async ({ page }) => {
  await page.evaluate(() => {
    // Simulerar oavgjort resultat
    window.__TEST_FORCE_TIE__ = true;
  });
});

Then('ska oavgjort-texten visas', async ({ page }) => {
  await expect(page.getByTestId('tie-result')).toBeVisible();
});

Then('ska mitt namn markeras som mig själv', async ({ page }) => {
  await expect(page.getByTestId('player-me')).toBeVisible();
});

When('jag klickar på spela-igen-knappen', async ({ page }) => {
  await page.getByTestId('btn-restart-vote').click();
});

Then('ska min röst registreras', async ({ page }) => {
  await expect(page.getByTestId('btn-restart-vote')).toBeDisabled();
});

When('jag klickar på tillbaka-knappen', async ({ page }) => {
  await page.getByTestId('btn-back-menu').click();
});

Then('ska jag hamna på menyn', async ({ page }) => {
  await expect(page).toHaveURL('/');
});