import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import  { GamePage }from '../pages/game.page.js';
import { LandingPage } from '../pages/landing.page.js';
 
const { Given, When, Then } = createBdd();
Given('I open the landing page', async ({ page }) => {
  const landing = new LandingPage(page);
  await landing.goto();
});
 
Then('I should see the Word Master title', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /word master/i })).toBeVisible();
  await expect(page.getByText(/word master/i)).toBeVisible();
});
 
Then('I should see the Create a lobby button', async ({ page }) => {
  await expect(page.getByRole('button', { name: /skapa en lobby/i })).toBeVisible();
});
 
Then('I should see the Join a lobby button', async ({ page }) => {
  await expect(page.getByRole('button', { name: /gå med i en lobby/i })).toBeVisible();
});
When('I click Create a lobby', async ({ page }) => {
  const game = new GamePage(page);
  await game.clickCreateLobby();
});
 
Then('I should see the lobby page', async ({ page }) => {
  await page.waitForURL('**/lobby/**', { timeout: 15000 });
  await expect(page.getByText(/lobby id/i)).toBeVisible();
});