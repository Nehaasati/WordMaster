// lobby page

export class LobbyPage {
  constructor(page) {
    this.page = page;

    this.playersList = '.players-list .player-box';

    this.prevBtn = '.ch-arrow >> nth=0';
    this.nextBtn = '.ch-arrow >> nth=1';

    this.standardModeBtn = 'text=Standard WordMaster';
    this.blitzModeBtn = 'text=Blitz WordMaster';

    this.addBotBtn = 'text=+ Lägg till motståndare';
    this.readyBtn = '.ready-btn';
    this.startBtn = 'text=Starta spelet';
    this.nameInput = '.wm-modal-input';
    this.confirmBtn = '.wm-modal-btn--confirm';
  }

  async waitForLobby() {
    await this.page.waitForURL('**/lobby/**', { timeout: 15000 });
    await this.page.waitForSelector(this.readyBtn, { timeout: 15000 });
  }

  async getPlayers() {
    return await this.page.$$eval(this.playersList, boxes =>
      boxes.map(b => b.textContent.trim())
    );
  }

  async enterName(name) {
    await this.page.fill(this.nameInput, name);
  }

  async confirm() {
    await this.page.click(this.confirmBtn);
  }

  async clickReady() {
    await Promise.all([
      this.page.waitForResponse((response) =>
        response.url().includes('/ready/') && response.status() === 200,
      ),
      this.page.click(this.readyBtn),
    ]);
  }

  async clickStart() {
    await Promise.all([
      this.page.waitForResponse((response) =>
        response.url().includes('/start') && response.status() === 200,
      ),
      this.page.click(this.startBtn),
    ]);
  }
}

