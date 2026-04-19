export default class LobbyPage {
  constructor(page) {
    this.page = page;
  }

  async waitForLobbyToLoad() {
    await this.page.getByTestId('lobby-title').waitFor();
  }

  async getCharacterImage() {
    return this.page.getByTestId('character-image');
  }

  async expectSelfReady() {
    const playerId = await this.page.evaluate(() => localStorage.getItem('playerId'));
    await this.page.getByTestId(`player-ready-${playerId}`).waitFor();
  }
}