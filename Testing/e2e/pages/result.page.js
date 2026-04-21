export default class ResultPage {
  constructor(page) {
    this.page = page;
  }

  async waitForLoad() {
    await this.page.getByTestId('result-page').waitFor();
  }

  async getWinnerText() {
    return this.page.getByTestId('winner-text');
  }

  async getScoreboard() {
    return this.page.locator('.rp-scoreboard');
  }

  async getTieText() {
    return this.page.getByText('Oavgjort!');
  }

  async getPlayerMe() {
    return this.page.getByText('(du)');
  }

  async clickRestart() {
    await this.page.getByTestId('btn-restart').click();
  }

  async clickBackMenu() {
    await this.page.getByText('Tillbaka till menyn').click();
  }
}