import React, { useState} from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/Landingpage.css'
import type { ModalType, CreateModalProps, JoinModalProps } from '../interfaces/Landing'
/////

const NameStep: React.FC< {
  playerName: string 
  onPlayerNameChange: (value: string) => void}> = ({playerName, onPlayerNameChange}) => (
  <>
  <p className='wm-modal-label'>Välj ett namn</p>
  <input className='wm-modal-input' placeholder='Skriv ditt namn ...' value={playerName} maxLength={20} onChange={(e) => onPlayerNameChange(e.target.value)} />
  </>
)
const CreateModal: React.FC<CreateModalProps> = ({ onClose, lobbyId, inviteCode }) => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
    }
  const handleEnterLobby = () => {
    const trimmedName = playerName.trim()
    if (trimmedName.length < 1) return

    localStorage.setItem("wordmaster-player-name", playerName);
    localStorage.setItem("isHost", "true");
    navigate(`/lobby/${lobbyId}`, {
      state: { isHost: true, playerName: trimmedName },
    });
  }
 return (
    <div className="wm-modal-overlay" onClick={handleBackdrop} data-testid="create-modal">
      <div className="wm-modal">
        <h2 className="wm-modal-title">Lobby Created</h2>
        <NameStep playerName={playerName} onPlayerNameChange={setPlayerName} />
        {lobbyId && (
          <div style={{ marginBottom: '1.2rem', color: 'rgba(225, 200, 255, 0.9)', fontSize: '1rem', textAlign: 'center' }}>
            Lobby ID: <strong style={{ color: '#eedeff', textShadow: '0 0 8px rgba(160, 80, 255, 0.4)' }}>{lobbyId}</strong>
          </div>
        )}
        <div className="wm-modal-btns">
          <button
            className="wm-modal-btn wm-modal-btn--confirm"
            onClick={handleEnterLobby}
            disabled= {playerName.trim().length < 1}
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
  const [playerName, setPlayerName] = useState<string>("")
  const navigate = useNavigate();
 
  const handleJoin = () => {
    const trimmedLobbyCode = value.trim().toUpperCase()
    const trimmedName = playerName.trim()

    if (value.trim().length >= 4) {
      navigate(`/lobby/${value.trim().toUpperCase()}`)
     navigate(`/lobby/${trimmedLobbyCode}`, {
       state: { isHost: false, playerName: trimmedName },
     });
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
        <NameStep playerName={playerName} onPlayerNameChange={setPlayerName} />
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
            disabled = {value.trim().length < 4 || playerName.trim().length < 1}
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
  const [lobbyId, setLobbyId] = useState<string>('')
  const [inviteCode, setInviteCode] = useState<string>('')
  const navigate = useNavigate();

  // Set-up backend data to create a lobby
  const handleCreateClick = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5024/api/lobby", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to create lobby");
        return;
      }
      const data = await response.json();
      setLobbyId(data.id);
      setInviteCode(data.id);

      setModal("create");
    } catch (error) {
      console.error("Failed to create lobby", error);
    }
  };

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
            onClick={handleCreateClick}
            data-testid="btn-create"
          >
            Skapa en lobby
          </button>
          <button
            className="wm-btn"
            onClick={() => setModal('join')}
            data-testid="btn-join"
          >
            Gå med i en lobby
          </button>
        </div>
      </div>
 
      {modal === 'create' && (
        <CreateModal 
          onClose={() => setModal(null)} 
          lobbyId={lobbyId} 
          inviteCode={inviteCode} 
        />
      )}
      {modal === 'join'   && <JoinModal   onClose={() => setModal(null)} />}
    </div>
  )
}
 
export default LandingPage
