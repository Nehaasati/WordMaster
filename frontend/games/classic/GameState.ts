export interface GameState {
  currentCategory: string;
  requiredLetter: string;
}

export interface SubmitResponse {
  isValid: boolean;
  message: string;
  nextCategory: string;
  requiredLetter: string;
}
