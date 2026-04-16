// landing page

export default class LandingPage {
  constructor(page) {
    this.page = page;
    this.createLobbyBtn = 'text=SKAPA EN LOBBY';
    this.joinLobbyBtn = 'text=GÅ MED I EN LOBBY';
    this.nameInput = '.wm-modal-input';
    this.confirmBtn = '.wm-modal-btn--confirm';
  }

  async goto() {
    await this.page.goto('http://localhost:5173');
  }

  async openCreateLobbyModal() {
    await this.page.click(this.createLobbyBtn);
  }

  async openJoinLobbyModal() {
    await this.page.click(this.joinLobbyBtn);
  }

  async enterName(name) {
    await this.page.fill(this.nameInput, name);
  }

  async confirm() {
    await this.page.click(this.confirmBtn);
  }
}

