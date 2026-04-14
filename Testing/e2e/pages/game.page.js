import { expect } from '@playwright/test';
 
export default class GamePage {
  constructor(page) {
    this.page = page;
  }
  //go to landing page
  async goto() {
    await this.page.goto('/');
    }
    // Go to game page
    async gotoGame() {
    await this.page.goto('/game');
    }
    // Go to a specific lobby
    async clickCreateLobby() {
    await this.page.getByTestId('btn-create').click();
  }
 
  // Create a real lobby using the backend API
  async createLobbyViaApi() {
    const res = await fetch(`${BASE_API}/lobby`, { method: 'POST' });
    const data = await res.json();
    this.lobbyId = data.lobbyId;
    this.inviteCode = data.inviteCode;
    return data;
  }

  // Join lobby using backend API
  async joinLobbyViaApi(lobbyId, playerName, characterId = 'ugglan') {
    const res = await fetch(`${BASE_API}/lobby/${lobbyId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, characterId, isHost: false })
    });
    return await res.json();
  }

  // Get lobby state from API
  async getLobbyState(lobbyId) {
    const res = await fetch(`${BASE_API}/lobby/${lobbyId}`);
    return await res.json();
  }

  // Click Create Lobby button
  async clickCreateLobby() {
    await this.page.getByTestId('btn-create').click();
  }

  // Click Join Lobby button
  async clickJoinLobby() {
    await this.page.getByTestId('btn-join').click();
  }

  // Type a lobby code in the join input
  async typeJoinCode(code) {
    await this.page.getByTestId('join-input').fill(code);
  }

  // Click the submit join button
  async submitJoin() {
    await this.page.getByTestId('join-submit').click();
  }

  // Click Redo button in lobby
  async clickReady() {
    await this.page.locator('.ready-btn').click();
  }

  // Click next character arrow
  async clickNextCharacter() {
    const arrows = this.page.locator('.ch-arrow');
    await arrows.last().click();
  }

  // Get the current character name shown
  async getCharacterName() {
    return await this.page.locator('.character-name').textContent();
  }

  // Wait until characters have loaded
  async waitForCharacters() {
    await this.page.waitForSelector('.character-name', { timeout: 5000 });
  }

  // Click Freeze button in game
  async clickFreeze() {
    await this.page.getByTestId('btn-freeze').click();
  }

  // Click Mix button in game
  async clickMix() {
    await this.page.getByTestId('btn-mix').click();
  }

  // Click Stop button in game
  async clickStop() {
    await this.page.getByTestId('btn-stop').click();
  }

  // Type a word into a category input
  async typeWordInCategory(categoryId, word) {
    await this.page.getByTestId(`input-${categoryId}`).fill(word);
  }

  // Get score number from screen
  async getScore() {
    const text = await this.page.getByTestId('score').textContent();
    return parseInt(text?.replace('POÄNG: ', '') || '0');
  }

  // Get timer text
  async getnewgazz() {
    return await this.page.getByTestId('timer').textContent();
  }

  // Get all letter tiles as array
  async getLetterTiles() {
    return await this.page.getByTestId('letter-tile').allTextContents();
  }

  // Count how many letter tiles are shown
  async getLetterCount() {
    return await this.page.getByTestId('letter-tile').count();
  }
}