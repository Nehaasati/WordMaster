import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Character } from "../src/interfaces/interface.tsx";
import type Player from "../src/interfaces/Player.ts";
import "../css/lobby.css";
import * as signalR from "@microsoft/signalr";

/* -------------------------------------------------------
   Name Modal — supports 3 entry modes:
   - host: name only
   - invite: name only
   - join: name + lobby code
-------------------------------------------------------- */
const NameModal: React.FC<{
  mode: "host" | "invite" | "join";
  lobbyIdFromUrl?: string;
  onConfirm: (name: string, code?: string) => void;
}> = ({ mode, lobbyIdFromUrl, onConfirm }) => {
  const [playerName, setPlayerName] = useState("");
  const [code, setCode] = useState("");

  const showCodeField = mode === "join";

  return (
    <div className="wm-modal-overlay">
      <div className="wm-modal">
        <h2 className="wm-modal-title">
          {mode === "host" ? "Create Lobby" : "Join Lobby"}
        </h2>

        <p className="wm-modal-label">Välj ett namn</p>
        <input
          className="wm-modal-input"
          placeholder="Skriv ditt namn ..."
          value={playerName}
          maxLength={20}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        {/* Only show lobby code field for "join" mode */}
        {showCodeField && (
          <input
            className="wm-modal-input"
            placeholder="Enter lobby code..."
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        )}

        <div className="wm-modal-btns">
          <button
            className="wm-modal-btn wm-modal-btn--confirm"
            disabled={!playerName.trim() || (showCodeField && !code.trim())}
            onClick={() =>
              onConfirm(
                playerName.trim(),
                mode === "invite" ? lobbyIdFromUrl : code.trim(),
              )
            }
          >
            Fortsätt
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------
   Character list
-------------------------------------------------------- */
const Characters: Character[] = [
  { id: 1, name: "Owl", image: "../images/owl.png" },
  { id: 2, name: "Leopard", image: "../images/leo.png" },
  { id: 3, name: "Mouse", image: "../images/mouse.png" },
  { id: 4, name: "Bear", image: "../images/bear.png" },
];

/* -------------------------------------------------------
   Lobby Page
-------------------------------------------------------- */
export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  /* -------------------------------------------------------
     Determine entry mode:
     - host: came from CreateModal
     - join: came from JoinModal
     - invite: direct URL access
  -------------------------------------------------------- */
  const entryMode: "host" | "join" | "invite" =
    location.state?.isHost === true
      ? "host"
      : location.state?.isHost === false
        ? "join"
        : lobbyId
          ? "invite"
          : "invite";

  /* -------------------------------------------------------
     Clean old playerId when entering via invite link
     (prevents incorrect host/guest behavior)
  -------------------------------------------------------- */
  useEffect(() => {
    if (entryMode === "invite") {
      localStorage.removeItem("playerId");
      localStorage.removeItem("isHost");
    }
  }, [entryMode]);

  /* -------------------------------------------------------
   Player name handling
-------------------------------------------------------- */
  // Determine initial name depending on entry mode
  const initialNameFromStorage =
    entryMode === "invite"
      ? "" // Force empty name for invite link
      : localStorage.getItem("wordmaster-player-name") || "";

  // Player name state
  const [playerName, setPlayerName] = useState<string>(
    location.state?.playerName || initialNameFromStorage,
  );

  // Show modal if no name OR if entering via invite
  const [showNameModal, setShowNameModal] = useState(
    entryMode === "invite" ? true : !playerName,
  );

  /* -------------------------------------------------------
     Player identity and lobby state
  -------------------------------------------------------- */
  const [playerId, setPlayerId] = useState<string | null>(
    localStorage.getItem("playerId"),
  );

  const [isHost, setIsHost] = useState<boolean>(false);
  const [realLobbyId, setRealLobbyId] = useState<string>(lobbyId || "");
  const [players, setPlayers] = useState<Player[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /* -------------------------------------------------------
     Character carousel
  -------------------------------------------------------- */
  const [index, setIndex] = useState(0);
  const character = Characters[index];
  const prev = () =>
    setIndex((i) => (i - 1 + Characters.length) % Characters.length);
  const next = () => setIndex((i) => (i + 1) % Characters.length);

  /* -------------------------------------------------------
     Info box
  -------------------------------------------------------- */
  const [open, setOpen] = useState(false);
  const infoBoxRef = useRef<HTMLDivElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);

  /* -------------------------------------------------------
     Auto-clear message
  -------------------------------------------------------- */
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  /* -------------------------------------------------------
     Close info box on outside click
  -------------------------------------------------------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        infoBoxRef.current &&
        infoBtnRef.current &&
        !infoBoxRef.current.contains(target) &&
        !infoBtnRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* -------------------------------------------------------
     Fetch lobby data from backend
     - Determines real playerId, isHost, isReady
     - Ensures frontend trusts backend as the source of truth
  -------------------------------------------------------- */
  useEffect(() => {
    if (!realLobbyId || !playerName) return;

    const fetchLobby = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:5024/api/lobby/${realLobbyId}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        setPlayers(data.players || []);

        // Find current player by name
        const me = data.players?.find(
          (p: Player) => p.name.toLowerCase() === playerName.toLowerCase(),
        );

        if (me) {
          setPlayerId(me.id);
          localStorage.setItem("playerId", me.id);
          setIsHost(me.isHost);
          setReady(me.isReady);
        }
      } catch (err) {
        console.error("Faild to fetch lobby", err);
        setMessage("Kunde inte hämta lobbyn. Försök igen.");
      }
    };

    fetchLobby();
  }, [realLobbyId, playerName]);

  /* -------------------------------------------------------
     SignalR connection
  -------------------------------------------------------- */
  useEffect(() => {
    if (!realLobbyId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://127.0.0.1:5024/lobbyHub")
      .withAutomaticReconnect()
      .build();

    connection.start().then(async () => {
      await connection.invoke("JoinLobbyGroup", realLobbyId);

      // When a new player joins
      connection.on("PlayerJoined", (p: Player) =>
        setPlayers((prev) =>
          prev.some((x) => x.id === p.id) ? prev : [...prev, p],
        ),
      );

      // When a player becomes ready
      connection.on("PlayerReady", (id: string) =>
        setPlayers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isReady: true } : p)),
        ),
      );

      // When host starts the game
      connection.on("GameStarted", (id: string) => navigate(`/game/${id}`));
    });

    return () => {
      connection.stop();
    };
  }, [realLobbyId, navigate]);

  /* -------------------------------------------------------
     Handle Ready:
     - Host: only send ready
     - Guest: always attempt join first
       (backend will reuse existing player if already joined)
  -------------------------------------------------------- */
const handleReady = async () => {
  // HOST → only send ready
  if (isHost) {
    await fetch(
      `http://127.0.0.1:5024/api/lobby/${realLobbyId}/ready/${playerId}`,
      { method: "POST" },
    );
    setReady(true);
    return;
  }

  // GUEST → always attempt join
  const joinRes = await fetch(
    `http://127.0.0.1:5024/api/lobby/${realLobbyId}/join`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playerName }),
    },
  );

  const data = await joinRes.json();

  if (!joinRes.ok) {
    setMessage(data.error || "Failed to join lobby");
    return;
  }

  // Use the returned playerId immediately
  const newId = data.player.id;
  setPlayerId(newId);
  localStorage.setItem("playerId", newId);

  // Send ready immediately after join
  await fetch(`http://127.0.0.1:5024/api/lobby/${realLobbyId}/ready/${newId}`, {
    method: "POST",
  });

  setReady(true);
};

  /* -------------------------------------------------------
     Host starts the game
  -------------------------------------------------------- */
  const handleStartGame = async () => {
    const res = await fetch(
      `http://127.0.0.1:5024/api/lobby/${realLobbyId}/start/${playerId}`,
      { method: "POST" },
    );

    if (!res.ok) setMessage(await res.text());
  };

  /* -------------------------------------------------------
     Show modal if name not set
  -------------------------------------------------------- */

  if (showNameModal) {
    return (
      <NameModal
        mode={entryMode}
        lobbyIdFromUrl={lobbyId}
        onConfirm={(name, code) => {
          localStorage.setItem("wordmaster-player-name", name);
          setPlayerName(name);
          setRealLobbyId(code || lobbyId || "");
          setShowNameModal(false);
        }}
      />
    );
  }

  /* -------------------------------------------------------
     Copy invite link
  -------------------------------------------------------- */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Länk kopierad!");
  };

  if (!playerName) return null;

  /* -------------------------------------------------------
     UI Rendering
  -------------------------------------------------------- */
  return (
    <div className="page">
      <div className="container">
        <div className="col">
          <h1 className="title">VÄLJ EN KARAKTÄR</h1>

          <div className="player-box" style={{ marginBottom: "20px" }}>
            <p>DITT NAMN: {playerName}</p>
          </div>

          <div className="players-list">
            {players.map((p, index) => (
              <div key={p.id} className="player-box">
                <p>
                  Spelare {index + 1}: {p.name} {p.isReady ? "Ja" : ""}
                </p>
              </div>
            ))}
          </div>

          {realLobbyId && (
            <div className="lobby-info">
              <p className="wm-modal-label">
                LOBBY ID:{" "}
                <strong
                  style={{
                    color: "#eedeff",
                    textShadow: "0 0 10px rgba(160, 80, 255, 0.5)",
                  }}
                >
                  {realLobbyId}
                </strong>
              </p>

              <button
                onClick={copyToClipboard}
                className="wm-modal-btn wm-modal-btn--cancel"
              >
                KOPIERA INBJUDNINGSLÄNK
              </button>
            </div>
          )}

          <div className="character-carousel">
            <button className="ch-arrow" onClick={prev}>
              <img src="/images/prev.png" className="ch-arrow-img" />
            </button>

            <div className="characters">
              <img
                key={character.id}
                src={character.image}
                alt={character.name}
              />
            </div>

            <button className="ch-arrow" onClick={next}>
              <img src="/images/next.png" className="ch-arrow-img" />
            </button>
          </div>

          {message && <div className="lobby-message">{message}</div>}

          <button
            className={`ready-btn ${ready ? "isReady-btn" : ""}`}
            onClick={() => {
              if (!ready) {
                handleReady();
              } else if (isHost) {
                handleStartGame();
              }
            }}
          >
            {ready
              ? isHost
                ? "Starta spelet"
                : "Väntar på värden..."
              : "Redo"}
          </button>

          <div className="info-wrapper">
            <div
              ref={infoBoxRef}
              className={`info-box ${open ? "active" : ""}`}
            >
              <p>
                <b>Ugglan:</b> Får +3 poäng för varje giltig ord som är längre
                än 8 bokstäver.
                <br />
                <b>Leopard:</b> Får +3 poäng om ett giltigt ord skickas in inom
                10 sekunder.
                <br />
                <b>Musen:</b> Får +1 poäng för varje giltigt ord som är kortare
                än 4 bokstäver.
                <br />
                <b>Björnen:</b> Har immun mot freeze.
              </p>
            </div>

            <button
              ref={infoBtnRef}
              type="button"
              className="info-icon"
              onClick={() => setOpen((prev) => !prev)}
            >
              <img src="/images/information.png" alt="Information" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}