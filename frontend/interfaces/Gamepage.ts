import type Player from "../src/interfaces/Player";
export interface Letter {
  id: string;
  char: string;
  used: boolean;
  isExtra: boolean;
  source?: "initial" | "extra" | "replacement" | "ability" | "shop";
}
export interface CategoryData {
  id: string;
  label: string;
  word: string;
  valid: boolean;
  feedback: string;
}
export interface StarData {
  id: number;
  left: number;
  top: number;
  size: number;
  d: string;
  del: string;
  min: string;
}
export interface Category {
  id: string;
  label: string;
}

export interface ValidateRequest {
  word: string;
  categoryId: string;
  letters: string[];
  playerId?: string;
  lobbyId: string;
}
export interface ValidateResponse {
  isValid: boolean;
  message?: string;
  bonusPoints?: number;
  replacementLetters?: string[];
}

export interface LobbyResponse {
  players: Player[];
  letters: string[];
}
