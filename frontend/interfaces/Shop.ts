export interface ShopItem {
  id: string
  label: string
  cost: number
  type: 'letter' | 'powerup'
}
export interface ShopState {
  balance: number
  earnedScore: number
  spentScore: number
  purchasedLetters: string[]
  powerups: Record<string, number>
  catalog: ShopItem[]
}
export interface ShopApiResponse {
  message: string
  state: ShopState
  item?: ShopItem
  purchasedLetter?: string
}
export interface ShopProps {
  score: number
  items: ShopItem[]
  powerups: Record<string, number>
  loading?: boolean
  disabled?: boolean
  error?: string
  onBuyLetter: (letter: string) => Promise<void>
  onBuyPowerup: (powerup: string) => Promise<void>
}
