export default class LobbyPage {
  constructor(page) {
    this.page = page;
  }

  async goto(lobbyId) {
    await this.page.goto(`/lobby/${lobbyId}`);
  }

  getPlayerName(name) {
    return this.page.getByText(name);
  }

  getHostBadge(name) {
    return this.page.locator(`[data-testid="host-badge-${name}"]`);
  }

  getCharacterTitle() {
    return this.page.getByText("VÄLJ EN KARAKTÄR");
  }
}