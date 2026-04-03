import React, { useState} from 'react'
import '../css/Landingpage.css'
import type { ModalType, CreateModalProps, JoinModalProps } from '../interfaces/Landing'

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