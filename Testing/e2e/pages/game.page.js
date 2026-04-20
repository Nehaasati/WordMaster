export default class GamePage {
  constructor(page) {
    this.page = page;
  }

  async waitForGameToLoad() {
    await this.page.getByTestId('game-page').waitFor();
  }

  async getTimer() {
    return this.page.getByTestId('timer');
  }

  async getScore() {
    return this.page.getByTestId('score');
  }

  async getCategoryInput(catId) {
    return this.page.getByTestId(`input-${catId}`);
  }

  async getFeedback(catId) {
    return this.page.getByTestId(`feedback-${catId}`);
  }

  async getLetters() {
    return this.page.locator('[data-testid="letter-tile"]');
  }

  async clickFreeze() {
    await this.page.getByTestId('btn-freeze').click();
  }

  async clickMix() {
    await this.page.getByTestId('btn-mix').click();
  }

  async clickInk() {
    await this.page.getByTestId('btn-black').click();
  }

  async clickFinish() {
    await this.page.getByTestId('btn-finish').click();
  }
}