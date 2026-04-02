import React, { useState, useRef } from 'react'
import './Landingpage.css' 
import type { ModalType, StarData, CreateModalProps, JoinModalProps } from '../interfaces/Landing'

const Stars: React.FC = () => {
    const stars = useRef<StarData[]>([])
if (!stars.current.length) {
    for (let i = 0; i < 60; i++) {
      const size = Math.random() * 2 + 0.5
      stars.current.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 40,
        size,
        d:   (2 + Math.random() * 4).toFixed(1) + 's',
        del: (Math.random() * 5).toFixed(1) + 's',
        min: (0.2 + Math.random() * 0.3).toFixed(2),
      })
    }
    }
 return (
    <div className="wm-stars" data-testid="stars">
      {stars.current.map((s) => (
        <div
          key={s.id}
          className="wm-star"
          style={{
            left:   s.left + '%',
            top:    s.top + '%',
            width:  s.size + 'px',
            height: s.size + 'px',
            ['--d'   as string]: s.d,
            ['--del' as string]: s.del,
            ['--min' as string]: s.min,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
const CreateModal: React.FC<CreateModalProps> = ({ onClose }) => {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
    }
 return (
    <div className="wm-modal-overlay" onClick={handleBackdrop} data-testid="create-modal">
      <div className="wm-modal">
        <h2 className="wm-modal-title">Lobby Created</h2>
        <p className="wm-modal-label">Your lobby is ready</p>
        <div className="wm-modal-btns">
          <button
            className="wm-modal-btn wm-modal-btn--confirm"
            onClick={onClose}
          >
            Enter Lobby
          </button>
          <button
            className="wm-modal-btn wm-modal-btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
const JoinModal: React.FC<JoinModalProps> = ({ onClose }) => {
  const [value, setValue] = useState<string>('')
 
  const handleJoin = () => {
    if (value.trim().length >= 4) {
      onClose()
    }
  }
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }
 
  return (
    <div className="wm-modal-overlay" onClick={handleBackdrop} data-testid="join-modal">
      <div className="wm-modal">
        <h2 className="wm-modal-title">Join a Lobby</h2>
        <input
          className="wm-modal-input"
          placeholder="Enter lobby code..."
          value={value}
          maxLength={6}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          autoFocus
          data-testid="join-input"
        />
        <div className="wm-modal-btns">
          <button
            className="wm-modal-btn wm-modal-btn--confirm"
            onClick={handleJoin}
            data-testid="join-submit"
          >
            Join
          </button>
          <button
            className="wm-modal-btn wm-modal-btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
//Landing page
const LandingPage: React.FC = () => {
  const [modal, setModal] = useState<ModalType>(null)
 
  return (
    <div className="wm-scene" data-testid="landing-page">
      <div className="wm-bg" />
      <div className="wm-overlay" />
      <Stars />
      <div className="wm-vignette" />
 
      <div className="wm-ui">
        <h1 className="wm-title">Word Master</h1>
        <div className="wm-btn-group">
          <button
            className="wm-btn"
            onClick={() => setModal('create')}
            data-testid="btn-create"
          >
            Create a lobby
          </button>
          <button
            className="wm-btn"
            onClick={() => setModal('join')}
            data-testid="btn-join"
          >
            Join a lobby
          </button>
        </div>
      </div>
 
      {modal === 'create' && <CreateModal onClose={() => setModal(null)} />}
      {modal === 'join'   && <JoinModal   onClose={() => setModal(null)} />}
    </div>
  )
}
 
export default LandingPage