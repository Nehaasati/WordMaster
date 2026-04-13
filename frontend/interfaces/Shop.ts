export interface ShopItem {
  id: string
  label: string
  emoji: string
  cost: number
  type: 'vowel' | 'letter' | 'powerup'
}
export interface BuyRequest {
  itemId: string
  cost: number
}