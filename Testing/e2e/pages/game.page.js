import { expect } from '@playwright/test';
 
export default class GamePage {
  constructor(page) {
    this.page = page;
  }
 
  async goto() {
    await this.page.goto('/');
  }