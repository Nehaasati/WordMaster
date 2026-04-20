import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import LandingPage from '../pages/landing.page.js';

const { Given, When, Then } = createBdd();


Then('ska jag se knappen {string}', async ({ page }, buttonText) => {
  await expect(page.getByRole('button', { name: buttonText })).toBeVisible();
});

When('jag klickar på skapa-lobby knappen', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.clickCreateLobby();
});

When('jag klickar på gå-med-i-lobby knappen', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.clickJoinLobby();
});

Then('ska skapa-lobby modalen visas', async ({ page }) => {
  await expect(page.getByTestId('modal-create-confirm')).toBeVisible();
});

Then('ska join-lobby modalen visas', async ({ page }) => {
  await expect(page.getByTestId('modal-join-confirm')).toBeVisible();
});