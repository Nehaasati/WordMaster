import { expect } from '@playwright/test';
 
export default class GamePage {
  constructor(page) {
    this.page = page;
  }
 
  async goto() {
    await this.page.goto('/');
    }
    async gotoGame() {
    await this.page.goto('/game');
    }
    async clickCreateLobby() {
    await this.page.getByTestId('btn-create').click();
  }
 
  async clickFreeze() {
    await this.page.getByTestId('btn-freeze').click();
    }
 async clickMix() {
    await this.page.getByTestId('btn-mix').click();
  }
 
  async clickStop() {
    await this.page.getByTestId('btn-stop').click();
  }
}