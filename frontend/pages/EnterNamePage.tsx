import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function EnterNamePage() {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // If the guest is comming through a link
  const lobbyId = params.get("lobby");
  const isJoiningLobby = !!lobbyId;

  const handleContinue = () => {
    if (!name.trim()) return;

    // If it is the host
    localStorage.setItem("wordmaster-player-name", name.trim());

    if (isJoiningLobby) {
      // The guest go in the same lobby
      navigate(`/lobby/${lobbyId}`, {
        state: { playerName: name.trim(), isHost: false },
      });
    } else {
      // The host create a lobby
      navigate("/create-lobby", {
        state: { playerName: name.trim(), isHost: true },
      });
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="title">Skriv ditt namn</h1>

        <input
          className="wm-modal-input"
          placeholder="Ditt namn..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          className="wm-modal-btn wm-modal-btn--confirm"
          onClick={handleContinue}
        >
          FORTSÄTT
        </button>
      </div>
    </div>
  );
}