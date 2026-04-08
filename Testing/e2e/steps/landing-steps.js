import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import GamePage from '../pages/game.page.js';
 
const { Given, When, Then } = createBdd();