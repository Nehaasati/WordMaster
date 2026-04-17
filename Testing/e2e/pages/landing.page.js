// landing page

export class LandingPage {
  constructor(page) {
    this.page = page;
    this.createLobbyBtn = 'text=SKAPA EN LOBBY';
    this.joinLobbyBtn = 'text=GÅ MED I EN LOBBY';
    this.nameInput = '.wm-modal-input';
    this.joinCodeInput = '.wm-modal-input >> nth=1';
    this.confirmBtn = '.wm-modal-btn--confirm';
  }

  async goto() {
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    await this.page.goto(appUrl);
  }

  async openCreateLobbyModal() {
    await this.page.click(this.createLobbyBtn);
    await this.page.waitForSelector(this.nameInput, { state: 'visible' });
  }

  async openJoinLobbyModal() {
    await this.page.click(this.joinLobbyBtn);
    await this.page.waitForSelector(this.nameInput, { state: 'visible' });
  }

  async enterName(name) {
    await this.page.fill(this.nameInput, name);
  }

  async enterJoinCode(code) {
    await this.page.fill(this.joinCodeInput, code);
  }

  async confirm() {
    await this.page.click(this.confirmBtn);
  }
}