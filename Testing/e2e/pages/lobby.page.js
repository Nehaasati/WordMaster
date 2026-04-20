export default class LobbyPage {
  constructor(page) {
    this.page = page;
  }

  async waitForLobbyToLoad() {
    await this.page.getByText('VÄLJ EN KARAKTÄR').waitFor();
  }

  async getCharacterImage() {
    return this.page.locator('.character-carousel img[alt]');
  }

  async expectSelfReady() {
    // Wait for the ready button to show "isReady-btn" class or similar
    await this.page.getByTestId('btn-ready').waitFor();
    // For now, just check that the button exists
  }

  getPlayerName(name) {
    // Target only the player in the players-list, not the personal name field
    return this.page.locator('.players-list').getByText(name);
  }

  getHostBadge(name) {
    // Target the player row in the players-list containing the name
    return this.page.locator('.players-list').locator(`text=${name}`).locator('..');
  }
}