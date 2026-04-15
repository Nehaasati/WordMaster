import React, { useState } from 'react'
import type { ShopProps } from '../interfaces/Shop'
import '../css/ShopPanel.css';
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
