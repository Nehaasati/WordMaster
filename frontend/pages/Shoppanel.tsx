import React, { useState } from "react";
import type { ShopProps } from "../interfaces/Shop";
import "../css/Shoppanel.css";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Shop action failed";

const ShopPanel: React.FC<ShopProps> = ({
  score,
  items,
  powerups,
  loading = false,
  disabled = false,
  error = "",
  onBuyLetter,
  onBuyPowerup,
}) => {
  const [toast, setToast] = useState("");
  const [toastOk, setToastOk] = useState(true);
  const [pendingItemId, setPendingItemId] = useState("");

  const vowels = items.filter((item) => item.type === "letter");
  const powerupItems = items.filter((item) => item.type === "powerup");

  const showToast = (msg: string, ok: boolean) => {
    setToast(msg);
    setToastOk(ok);
    setTimeout(() => setToast(""), 2000);
  };

  const buyLetter = async (id: string, cost: number, label: string) => {
    if (score < cost) {
      showToast("Not enough 💰!", false);
      return;
    }

    setPendingItemId(id);
    try {
      await onBuyLetter(id);
      showToast(`+${label} added!`, true);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setPendingItemId("");
    }
  };

  const buyPowerup = async (id: string, cost: number, label: string) => {
    if (score < cost) {
      showToast("Not enough 💰!", false);
      return;
    }

    setPendingItemId(id);
    try {
      await onBuyPowerup(id);
      showToast(`${label} ready!`, true);
    } catch (err) {
      showToast(getErrorMessage(err), false);
    } finally {
      setPendingItemId("");
    }
  };

  return (
    <div className="shop-panel" data-testid="shop-panel">
      <div className="shop-title">🏪 Shop</div>
      <div className="shop-balance">💰 {score} kr</div>

      <div className="shop-section-title">Swedish Vowels</div>
      <div className="shop-vowel-grid">
        {vowels.map((item) => (
          <button
            key={item.id}
            className="shop-vowel-btn"
            disabled={disabled || loading || pendingItemId === item.id || score < item.cost}
            onClick={() => buyLetter(item.id, item.cost, item.label)}
            data-testid={`shop-buy-${item.id}`}
          >
            <span className="shop-vowel-letter">{item.label}</span>
            <span className="shop-vowel-cost">{item.cost}💰</span>
          </button>
        ))}
      </div>
<div className="shop-section-title">Power-ups</div>
      <div className="shop-items">
        {powerupItems.map((item) => {
          const ownedCount = powerups[item.id] ?? 0;
          const isOwned = ownedCount > 0;
          return (
            <div className="shop-item" key={item.id}>
              <span className="shop-item-label">{item.label}</span>
              <button
                className={`shop-buy-btn ${isOwned ? 'shop-buy-btn--owned' : ''}`}
                disabled={disabled || loading || isOwned || pendingItemId === item.id || score < item.cost}
                onClick={() => buyPowerup(item.id, item.cost, item.label)}
                data-testid={`shop-buy-${item.id}`}
              >
                {isOwned ? `✓ ${ownedCount}` : `${item.cost}💰`}
              </button>
            </div>
          )
        })}
      </div>
 {error && <div className="shop-toast shop-toast--error">{error}</div>}
 {toast && <div className={`shop-toast ${toastOk ? '' : 'shop-toast--error'}`}>{toast}</div>}
    </div>
  )
}

export default ShopPanel
