// lobby page

class LobbyPage {
  constructor(page) {
    this.page = page;
    this.readyBtn = '.ready-btn';
    this.playerBoxes = '.player-box';
    this.addBotBtn = 'text=+ Lägg till motståndare';
    this.startBtn = 'text=Starta spelet';
    this.leaveLobbyBtn = 'text=Lämna lobbyn';
  }

  async waitForLobby() {
    await this.page.waitForSelector('.players-list');
  }

  async getPlayers() {
    return await this.page.$$eval(this.playerBoxes, boxes =>
      boxes.map(b => b.textContent.trim())
    );
  }

  async clickReady() {
    await this.page.click(this.readyBtn);
  }

  async clickStart() {
    await this.page.click(this.startBtn);
  }

  async addBot() {
    await this.page.click(this.addBotBtn);
  }

  async leaveLobby() {
    await this.page.click(this.leaveLobbyBtn);
  }
}

module.exports = { LobbyPage };