export interface Letter {
  id: string
  char: string
  used: boolean
  isExtra: boolean
}
export interface CategoryData {
  word: string
  valid: boolean
  feedback: string
}
export interface StarData {
  id: number
  left: number
  top: number
  size: number
  d: string
  del: string
  min: string
}
export interface Category {
  id: string
  label: string
}
 
export interface ValidateRequest {
  word: string
  category: string
  letters: string[]
}
export interface ValidateResponse {
  isValid: boolean
  message?: string
}