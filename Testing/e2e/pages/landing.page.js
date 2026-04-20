export default class LandingPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickCreateLobby() {
    await this.page.getByTestId('landing-create-btn').click();
  }

  async clickJoinLobby() {
    await this.page.getByTestId('landing-join-lobby').click();
  }

  getCreateModalConfirmButton() {
    return this.page.getByTestId('modal-create-confirm');
  }

  getJoinModalConfirmButton() {
    return this.page.getByTestId('modal-join-confirm');
  }
}