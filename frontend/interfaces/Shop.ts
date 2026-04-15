export interface ShopItem {
  id: string
  label: string
  cost: number
  type: 'vowel' | 'letter' | 'powerup'
}
export interface ShopProps {
  score: number
  lobbyId?: string
  onBuyLetter: (letter: string, cost: number) => void
  onBuyPowerup: (powerup: string, cost: number) => void
}