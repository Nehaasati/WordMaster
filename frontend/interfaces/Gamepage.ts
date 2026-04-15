export default interface Letter {
  id: string
  char: string
  used: boolean
  isExtra: boolean
}
export default interface CategoryData {
  word: string;
  valid: boolean;
  feedback: string;
}
export default interface StarData {
  id: string;
  left: number;
  top: number;
  size: number;
  d: string;
  del: string;
  min: string;
}
export default interface Category {
  id: string;
  label: string;
}
 
export default interface ValidateRequest {
  word: string;
  category: string;
  letters: string[];
}
export default interface ValidateResponse {
  isValid: boolean;
  message?: string;
}