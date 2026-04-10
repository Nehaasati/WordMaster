import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Landingpage.css";
import type {
  ModalType,
  CreateModalProps,
  JoinModalProps,
} from "../interfaces/Landing";

const NameStep: React.FC<{
  playerName: string;
  onPlayerNameChange: (value: string) => void;
}> = ({ playerName, onPlayerNameChange }) => (
  <>
    <p className="wm-modal-label">Välj ett namn</p>
    <input
      className="wm-modal-input"
      placeholder="Skriv ditt namn ..."
      value={playerName}
      maxLength={20}
      onChange={(e) => onPlayerNameChange(e.target.value)}
    />
  </>
);

// CREATE MODAL 

const CreateModal: React.FC<CreateModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCreateLobby = async () => {
    const trimmedName = playerName.trim();
    if (!trimmedName) return;

    try {
      const response = await fetch("http://127.0.0.1:5024/api/lobby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Create lobby failed:", errorText);
        return;
      }

      const data = await response.json();

      // Store data
      localStorage.setItem("wordmaster-player-name", trimmedName);
      localStorage.setItem("playerId", data.playerId);
      localStorage.setItem("isHost", "true");

      navigate(`/lobby/${data.lobbyId}`, {
        state: {
          isHost: true,
          playerName: trimmedName,
        },
      });
    } catch (err) {
      console.error("Error creating lobby:", err);
    }
  };

  return (
    <div className="wm-modal-overlay" onClick={handleBackdrop}>
      <div className="wm-modal">
        <h2 className="wm-modal-title">Create Lobby</h2>

        <NameStep playerName={playerName} onPlayerNameChange={setPlayerName} />

        <div className="wm-modal-btns">
          <button
            className="wm-modal-btn wm-modal-btn--confirm"
            onClick={handleCreateLobby}
            disabled={!playerName.trim()}
          >
            Skapa Lobby
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
  );
};

// JOIN MODAL

const JoinModal: React.FC<JoinModalProps> = ({ onClose }) => {
  const [code, setCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = playerName.trim();

    if (!trimmedCode || !trimmedName) return;

    localStorage.setItem("wordmaster-player-name", trimmedName);
    localStorage.setItem("isHost", "false");

    navigate(`/lobby/${trimmedCode}`, {
      state: {
        isHost: false,
        playerName: trimmedName,
      },
    });

    onClose();
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="wm-modal-overlay" onClick={handleBackdrop}>
      <div className="wm-modal">
        <h2 className="wm-modal-title">Join Lobby</h2>

        <NameStep playerName={playerName} onPlayerNameChange={setPlayerName} />

        <input
          className="wm-modal-input"
          placeholder="Enter lobby code..."
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        <div className="wm-modal-btns">
          <button
            className="wm-modal-btn wm-modal-btn--confirm"
            onClick={handleJoin}
            disabled={!code.trim() || !playerName.trim()}
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
  );
};

// LANDING PAGE

const LandingPage: React.FC = () => {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <div className="wm-scene">
      <div className="wm-bg" />
      <div className="wm-overlay" />
      <div className="wm-vignette" />

      <div className="wm-ui">
        <h1 className="wm-title">WORD MASTER</h1>

        <div className="wm-btn-group">
          <button className="wm-btn" onClick={() => setModal("create")}>
            SKAPA EN LOBBY
          </button>

          <button className="wm-btn" onClick={() => setModal("join")}>
            GÅ MED I EN LOBBY
          </button>
        </div>
      </div>

      {modal === "create" && <CreateModal onClose={() => setModal(null)} />}

      {modal === "join" && <JoinModal onClose={() => setModal(null)} />}
    </div>
  );
};

export default LandingPage;