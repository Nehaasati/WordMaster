import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('att jag är på resultatsidan', async ({ page }) => {
  await page.goto('/result/test-game');
});

Then('ska jag se resultat-titeln', async ({ page }) => {
  await expect(page.getByText('Resultat')).toBeVisible();
});

Then('ska vinnarrutan visas', async ({ page }) => {
  await expect(page.getByTestId('winner-text')).toBeVisible();
});

Then('ska jag se scoreboarden', async ({ page }) => {
  await expect(page.locator('.rp-scoreboard')).toBeVisible();
});

Then('ska oavgjort-texten visas', async ({ page }) => {
  await expect(page.getByText('Oavgjort')).toBeVisible();
});

Then('ska mitt namn markeras som mig själv', async ({ page }) => {
  await expect(page.getByText('(du)')).toBeVisible();
});

When('jag klickar på spela-igen-knappen', async ({ page }) => {
  await page.getByTestId('btn-restart').click();
});

When('jag klickar på tillbaka-knappen', async ({ page }) => {
  await page.getByText('Tillbaka till menyn').click();
});

Then('ska jag hamna på menyn', async ({ page }) => {
  await expect(page).toHaveURL('/');
});