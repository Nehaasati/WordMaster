export class FinishPage {
  constructor(page) {
    this.page = page;

    this.scoreLabel = 'text=POÄNG';
    this.stopButton = 'text=Stopp';
    this.matchEndedText = 'text=Match ended';
    this.waitingReadyState = 'text=WaitingForReady';
  }

  async waitForGameRunning() {
    await this.page.waitForSelector(this.scoreLabel);
  }

  async waitForMatchEnd() {
    await this.page.waitForSelector(this.stopButton);
  }

  async isMatchEndedVisible() {
    return await this.page.locator(this.matchEndedText).isVisible();
  }

  async isLobbyWaiting() {
    return await this.page.locator(this.waitingReadyState).isVisible();
  }
}