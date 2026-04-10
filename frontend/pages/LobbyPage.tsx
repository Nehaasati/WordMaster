import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Character } from "../src/interfaces/interface.tsx";
import type Player from "../src/interfaces/Player.ts";
import "../css/lobby.css";
import * as signalR from "@microsoft/signalr";

const Characters: Character[] = [
  { id: 1, name: "Owl", image: "../images/owl.png" },
  { id: 2, name: "Leopard", image: "../images/leo.png" },
  { id: 3, name: "Mouse", image: "../images/mouse.png" },
  { id: 4, name: "Bear", image: "../images/bear.png" },
];

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  // Hämta isHost från navigation state
  const location = useLocation();

  // Player name
  const selectedPlayerName =
    location.state?.playerName?.trim() ||
    localStorage.getItem("wordmaster-player-name")?.trim() ||
    "";

  // Player ID from backend
  const [playerId, setPlayerId] = useState<string | null>(
    localStorage.getItem("playerId"),
  );

  // Host flag after fetching the lobby
  const [isHost, setIsHost] = useState<boolean>(
    location.state?.isHost ?? localStorage.getItem("isHost") === "true",
  );

  // Lobby id from backend
  const [realLobbyId, setRealLobbyId] = useState<string>("");

  // players
  const [players, setPlayers] = useState<Player[]>([]);

  // Ready status
  const [ready, setReady] = useState(false);

  // Handling names on the game
  const [tempName, setTempName] = useState("");

  // Backend messages
  const [message, setMessage] = useState<string | null>(null);

  // character carousel
  const [index, setIndex] = useState(0);
  const character = Characters[index];
  const prev = () =>
    setIndex((i) => (i - 1 + Characters.length) % Characters.length);
  const next = () => setIndex((i) => (i + 1) % Characters.length);

  // Info box
  const [open, setOpen] = useState(false);
  const infoBoxRef = useRef<HTMLDivElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);

  // 1) FETCH LOBBY

  useEffect(() => {
    const fetchLobby = async () => {
      if (!lobbyId) return;

      try {
        const response = await fetch(
          `http://127.0.0.1:5024/api/lobby/${lobbyId}`,
        );
        if (!response.ok) return;

        const data = await response.json();
        setRealLobbyId(data.id);

        if (data.players) {
          setPlayers(data.players);
          const me = data.players.find(
            (p: Player) =>
              p.name.trim().toLowerCase() === selectedPlayerName.toLowerCase(),
          );

          if (me) {
            setPlayerId(me.id);
            localStorage.setItem("playerId", me.id);

            setIsHost(me.isHost);
            localStorage.setItem("isHost", me.isHost ? "true" : "false");
          }
        }
      } catch (err) {
        console.error("Failed to fetch lobby", err);
      }
    };

    fetchLobby();
  }, [lobbyId, selectedPlayerName]);

  const hasName =
    !!location.state?.playerName ||
    !!localStorage.getItem("wordmaster-player-name");

  // 2) SIGNALR CONNECTION
  useEffect(() => {
    if (!realLobbyId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://127.0.0.1:5024/lobbyHub")
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(async () => {
        await connection.invoke("JoinLobbyGroup", realLobbyId);

        connection.onreconnected(async () => {
          await connection.invoke("JoinLobbyGroup", realLobbyId);
        });

        connection.on("PlayerJoined", (player: Player) => {
          setPlayers((prev) => {
            if (prev.some((p) => p.id === player.id)) return prev;
            if (prev.length >= 2) return prev;
            return [...prev, player];
          });
        });

        connection.on("PlayerReady", (playerId: string) => {
          setPlayers((prev) =>
            prev.map((p) => (p.id === playerId ? { ...p, isReady: true } : p)),
          );
        });

        connection.on("GameStarted", (lobbyId: string) => {
          navigate(`/game/${lobbyId}`);
        });
      })
      .catch((err) => console.error("SignalR error:", err));

    return () => {
      connection.off("PlayerJoined");
      connection.off("PlayerReady");
      connection.off("GameStarted");
      connection.stop();
    };
  }, [realLobbyId, navigate]);

  // 3) READY FUNCTION

  const handleReady = async () => {
    if (!realLobbyId) return;

    // The host
    if (!isHost) {
      const joinResponse = await fetch(
        `http://127.0.0.1:5024/api/lobby/${realLobbyId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: selectedPlayerName }),
        },
      );

      if (!joinResponse.ok) {
        const data = await joinResponse.json();
        setMessage(data.error || "Lobbyn är full.");
        return;
      }

      const data = await joinResponse.json();
      const joinedPlayer = data.player;

      setPlayerId(joinedPlayer.id);
      localStorage.setItem("playerId", joinedPlayer.id);
    }

    const idToUse = playerId || localStorage.getItem("playerId");

    await fetch(
      `http://127.0.0.1:5024/api/lobby/${realLobbyId}/ready/${idToUse}`,
      { method: "POST" },
    );

    setReady(true);
  };

  // 4) START GAME (HOST ONLY)

  const handleStartGame = async () => {
    if (!isHost) return;
    if (!playerId || !realLobbyId) return;

    if (players.length < 2) {
      setMessage("Väntar på att den andra spelaren ska gå med...");
      return;
    }

    const startResponse = await fetch(
      `http://127.0.0.1:5024/api/lobby/${realLobbyId}/start/${playerId}`,
      { method: "POST" },
    );

    if (!startResponse.ok) {
      const errorMsg = await startResponse.text();
      setMessage("Kunde inte starta: " + errorMsg);
    }
  };

  // 5) AUTO-CLEAR MESSAGE
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // 6) INFO BOX CLICK OUTSIDE

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Länk kopierad!");
  };

  if (hasName) {
    return (
      <div className="page">
        <div className="container">
          <h1 className="title">SKRIV DITT NAMN</h1>

          <input
            className="wm-modal-input"
            placeholder="Ditt namn..."
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
          />

          <button
            className="wm-modal-btn wm-modal-btn--confirm"
            onClick={() => {
              if (!tempName.trim()) return;

              localStorage.setItem("wordmaster-player-name", tempName.trim());

              navigate(`/lobby/${lobbyId}`, {
                state: { playerName: tempName.trim(), isHost: false },
              });
            }}
          >
            FORTSÄTT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="col">
          <h1 className="title">VÄLJ EN KARAKTÄR</h1>

          {/* Player name */}
          {selectedPlayerName && (
            <div className="player-box" style={{ marginBottom: "20px" }}>
              <p>DITT NAMN: {selectedPlayerName}</p>
            </div>
          )}

          {/* Players list */}
          <div className="players-list">
            {players.map((p, index) => (
              <div key={p.id} className="player-box">
                <p>
                  Spelare {index + 1}: {p.name} {p.isReady ? "JA" : ""}
                </p>
              </div>
            ))}
          </div>

          {/* Lobby info */}
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

          {/* Character carousel */}
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

          {/* Backend message */}
          {message && <div className="lobby-message">{message}</div>}

          {/* Ready / Start button */}
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

          {/* Info box */}
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