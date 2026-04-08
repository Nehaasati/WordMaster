import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import GamePage from '../pages/game.page.js';
 
const { Given, When, Then } = createBdd();
Given('I open the landing page', async ({ page }) => {
  const game = new GamePage(page);
  await game.goto();
});
 
Then('I should see the Word Master title', async ({ page }) => {
  await expect(page.getByTestId('landing-page')).toBeVisible();
  await expect(page.getByText('Word Master')).toBeVisible();
});
 
Then('I should see the Create a lobby button', async ({ page }) => {
  await expect(page.getByTestId('btn-create')).toBeVisible();
});
 
Then('I should see the Join a lobby button', async ({ page }) => {
  await expect(page.getByTestId('btn-join')).toBeVisible();
});
When('I click Create a lobby', async ({ page }) => {
  const game = new GamePage(page);
  await game.clickCreateLobby();
});
 
Then('I should see the lobby page', async ({ page }) => {
  await expect(page.getByTestId('lobby-page')).toBeVisible();
});