export default class GamePage {
  constructor(page) {
    this.page = page;
  }

  async waitForGameToLoad() {
    await this.page.getByTestId('game-page').waitFor();
  }

  // --- Visible elements ---
  async getTimer() {
    return this.page.getByTestId('timer');
  }

  async getScore() {
    return this.page.getByTestId('score');
  }

  async getCategories() {
    return this.page.getByTestId('categories');
  }

  async getLettersContainer() {
    return this.page.getByTestId('letters');
  }

  async getLetters() {
    return this.page.locator('[data-testid="letter-tile"]');
  }

  async getCategoryInput(catId) {
    return this.page.getByTestId(`input-${catId}`);
  }

  async getFeedback(catId) {
    return this.page.getByTestId(`feedback-${catId}`);
  }

  async getUsedLetters() {
    return this.page.locator('[data-testid="letter-used"]');
  }

  async getInkEffect() {
    return this.page.getByTestId('ink-animation');
  }

  async getFreezeEffect() {
    return this.page.getByTestId('freeze-msg');
  }

  async getJokerLetter() {
    return this.page.getByTestId('joker-letter');
  }

  async getStoppedOverlay() {
    return this.page.getByTestId('stopped-overlay');
  }

  // --- Actions ---
  async typeWord(catId, word) {
    await this.page.getByTestId(`input-${catId}`).fill(word);
  }

  async clickFreeze() {
    await this.page.getByTestId('btn-freeze').click();
  }

  async clickInk() {
    await this.page.getByTestId('btn-black').click();
  }

  async clickFinish() {
    await this.page.getByTestId('btn-finish').click();
  }

  async clickJoker() {
    await this.page.getByTestId('btn-joker').click();
  }
}