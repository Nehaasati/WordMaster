import React, { useState } from "react";
import type { ShopProps } from "../interfaces/Shop";
import "../css/Shoppanel.css";
const VOWELS = [
  { id: 'A', label: 'A', cost: 5 },
  { id: 'E', label: 'E', cost: 5 },
  { id: 'I', label: 'I', cost: 5 },
  { id: 'O', label: 'O', cost: 5 },
  { id: 'U', label: 'U', cost: 5 },
  { id: 'Y', label: 'Y', cost: 5 },
  { id: 'Å', label: 'Å', cost: 5 },
  { id: 'Ä', label: 'Ä', cost: 5 },
  { id: 'Ö', label: 'Ö', cost: 5 },
]
const POWERUPS = [
  { id: 'freeze', label: 'Freeze', cost: 5 },
  { id: 'black',  label: 'Bläck',  cost: 5 },
  { id: 'mix',    label: 'Svenska Alphabet',    cost: 100 },
]
const ShopPanel: React.FC<ShopProps> = ({ score, onBuyLetter, onBuyPowerup }) => {
  const [owned, setOwned] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [toastOk, setToastOk] = useState(true)
const showToast = (msg: string, ok: boolean) => {
    setToast(msg); setToastOk(ok)
    setTimeout(() => setToast(''), 2000)
  }
const buyLetter = (id: string, cost: number) => {
    if (score < cost) { showToast('Not enough 💰!', false); return }
    onBuyLetter(id, cost)
    showToast(`+${id} added!`, true)
  }
const buyPowerup = (id: string, cost: number) => {
    if (score < cost) { showToast('Not enough 💰!', false); return }
    setOwned(prev => [...prev, id])
    onBuyPowerup(id, cost)
    showToast(`${id} ready!`, true)
  }
return (
    <div className="shop-panel" data-testid="shop-panel">
      <div className="shop-title">🏪 Shop</div>
      <div className="shop-balance">💰 {score} kr</div>

      <div className="shop-section-title">Swedish Vowels — 5💰</div>
      <div className="shop-vowel-grid">
        {VOWELS.map(item => (
          <button
            key={item.id}
            className="shop-vowel-btn"
            disabled={score < item.cost}
            onClick={() => buyLetter(item.id, item.cost)}
            data-testid={`shop-buy-${item.id}`}
          >
            <span className="shop-vowel-letter">{item.label}</span>
            <span className="shop-vowel-cost">{item.cost}💰</span>
          </button>
        ))}
      </div>
<div className="shop-section-title">Power-ups — 5💰 once</div>
      <div className="shop-items">
        {POWERUPS.map(item => {
          const isOwned = owned.includes(item.id)
          return (
            <div className="shop-item" key={item.id}>
              <span className="shop-item-label">{item.label}</span>
              <button
                className={`shop-buy-btn ${isOwned ? 'shop-buy-btn--owned' : ''}`}
                disabled={isOwned || score < item.cost}
                onClick={() => buyPowerup(item.id, item.cost)}
                data-testid={`shop-buy-${item.id}`}
              >
                {isOwned ? '✓' : `${item.cost}💰`}
              </button>
            </div>
          )
        })}
      </div>
 {toast && <div className={`shop-toast ${toastOk ? '' : 'shop-toast--error'}`}>{toast}</div>}
    </div>
  )
}

export default ShopPanel