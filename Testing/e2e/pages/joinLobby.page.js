export default class JoinLobbyPage {
  constructor(page) {
    this.page = page;
  }

  async fillName(name) {
    await this.page.getByTestId('name-input').fill(name);
  }

  async fillCode(code) {
    await this.page.getByTestId('join-code-input').fill(code);
  }

  async confirmJoin() {
    await this.page.getByTestId('modal-join-confirm').click();
  }
}