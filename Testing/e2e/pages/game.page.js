// game page
export class GamePage {
  constructor(page) {
    this.page = page;

    this.scoreLabel = 'text=POÄNG';
    this.timerLabel = 'text=TID';

    this.categoryInputs = {
      NAMN: 'input[placeholder="NAMN"]',
      MAT: 'input[placeholder="MAT"]',
      JOBB: 'input[placeholder="JOBB"]',
      LAND: 'input[placeholder="LAND"]',
      FÄRG: 'input[placeholder="FÄRG"]',
      DJUR: 'input[placeholder="DJUR"]',
      SAK: 'input[placeholder="SAK"]'
    };

    this.freezeBtn = 'text=Freeze';
    this.inkBtn = 'text=Bläck';
    this.mixBtn = 'text=Mix';
    this.stopBtn = 'text=Stopp';
    this.leaveGameBtn = 'text=Lämna spelet';
  }

  async waitForGameStart() {
    await this.page.waitForSelector(this.scoreLabel);
  }

  async fillCategory(category, word) {
    await this.page.fill(this.categoryInputs[category], word);
  }

  async clickFreeze() {
    await this.page.click(this.freezeBtn);
  }

  async clickInk() {
    await this.page.click(this.inkBtn);
  }

  async clickMix() {
    await this.page.click(this.mixBtn);
  }

  async waitForMatchEnd() {
    await this.page.waitForSelector(this.stopBtn);
  }

  async leaveGame() {
    await this.page.click(this.leaveGameBtn);
  }
}