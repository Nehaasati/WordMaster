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

  async getTieText() {
    return this.page.getByTestId('tie-result');
  }

  async clickRestartVote() {
    await this.page.getByTestId('btn-restart-vote').click();
  }

  async clickBackMenu() {
    await this.page.getByTestId('btn-back-menu').click();
  }
}