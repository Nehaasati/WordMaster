// lobby page

class LobbyPage {
  constructor(page) {
    this.page = page;

    // Player info
    this.playersList = '.players-list .player-box';

    // Character carousel
    this.prevBtn = '.ch-arrow >> nth=0';
    this.nextBtn = '.ch-arrow >> nth=1';
    this.characterName = '.character-name';
    this.characterDescription = '.character-description';

    // Game mode
    this.standardModeBtn = 'text=Standard WordMaster';
    this.blitzModeBtn = 'text=Blitz WordMaster';

    // Buttons
    this.addBotBtn = 'text=+ Lägg till motståndare';
    this.readyBtn = '.ready-btn';
    this.startBtn = 'text=Starta spelet';
    this.copyLinkBtn = 'text=KOPIERA INBJUDNINGSLÄNK';
  }

  async waitForLobby() {
    await this.page.waitForSelector('text=VÄLJ EN KARAKTÄR');
  }

  async getPlayers() {
    return await this.page.$$eval(this.playersList, boxes =>
      boxes.map(b => b.textContent.trim())
    );
  }

  async selectNextCharacter() {
    await this.page.click(this.nextBtn);
  }

  async selectPrevCharacter() {
    await this.page.click(this.prevBtn);
  }

  async chooseStandardMode() {
    await this.page.click(this.standardModeBtn);
  }

  async chooseBlitzMode() {
    await this.page.click(this.blitzModeBtn);
  }

  async addBot() {
    await this.page.click(this.addBotBtn);
  }

  async clickReady() {
    await this.page.click(this.readyBtn);
  }

  async clickStart() {
    await this.page.click(this.startBtn);
  }
}

module.exports = { LobbyPage };