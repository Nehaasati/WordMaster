import {useState, useEffect, useRef} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Character } from "../src/interfaces/interface.tsx";
import type Player from "../src/interfaces/Player.ts";
import "../css/lobby.css";
import * as signalR from "@microsoft/signalr";

// Map backend character ID → local image path
const CHARACTER_IMAGES: Record<string, string> = {
  ugglan:   "/images/owl.png",
  leopard:  "/images/leo.png",
  musen:    "/images/mouse.png",
  björnen:  "/images/bear.png",
};


export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  // Hämta isHost från navigation state
  const location = useLocation();
  // Om isHost inte skickas via navigation, defaulta till false
  const isHostFromNav = location.state?.isHost ?? false; // default till false om inte skickat från navigation
  const isHost = isHostFromNav; // sätt initialt värde baserat på navigation state
  const selectedPlayerName =
  location.state?.playerName?.trim() ||
  localStorage.getItem("wordmaster-player-name")?.trim() ||
  '';
  const [realLobbyId, setRealLobbyId] = useState<string>(""); //// ── Lobby state

  // State för att hålla koll på spelare i lobbyn
  const [players, setPlayers] = useState<Player[]>([]);
  // ── Character state ──────────────────────────────────────────
  const [characters,        setCharacters]        = useState<Character[]>([]);
  
  const [loadingCharacters, setLoadingCharacters] = useState(true);

  // fetch lobby data
  useEffect(() => {
    const fetchLobby = async () => {
      if (!lobbyId) return;
      try {
        const response = await fetch(
          `http://127.0.0.1:5024/api/lobby/${lobbyId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setRealLobbyId(data.id);

          // Om lobbydata innehåller spelare, uppdatera spelarläget
          if (data.players) {
            setPlayers(data.players as Player[]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch lobby", error);
      }
    };
    fetchLobby();
  }, [lobbyId]);
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5024/api/character");
        if (res.ok) {
          const data = await res.json();
          const withImages: Character[] = data.map(
            (c: Omit<Character, "image">) => ({
              ...c,
              image: CHARACTER_IMAGES[c.id] ?? "/images/owl.png",
            })
          );
          setCharacters(withImages);
        }
      } catch (err) {
        console.error("Error fetching characters:", err);
      } finally {
        setLoadingCharacters(false);
      }
    };
    fetchCharacters();
  }, []);

  const [index, setIndex] = useState(0); // för att ha koll på vilken karaktär visas
  
  const character = characters[index];
  const prev = () =>
  setIndex((i) => (i - 1 + characters.length) % characters.length);
  const next = () => setIndex((i) => (i + 1) % characters.length);
  const [ready, setReady] = useState(false);
  const [gameMode, setGameMode] = useState<'standard' | 'blitz'>('standard');

  const shareUrl = window.location.href;

  const [open,setOpen] = useState (false);
  const infoBoxRef = useRef<HTMLDivElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);

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
    navigator.clipboard.writeText(shareUrl);
    alert("Länk kopierad!");
  };

  // SignalR-anslutning och eventhantering
  useEffect(() => {
    if (!realLobbyId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://127.0.0.1:5024/lobbyHub")
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(async () => {
        console.log("Connected to SignalR");

        // Join the lobby group
        await connection.invoke("JoinLobbyGroup", realLobbyId);

        // Handle reconnection to rejoin the lobby group
        connection.onreconnected(async () => {
          console.log("Reconnected to SignalR");

          await connection.invoke("JoinLobbyGroup", realLobbyId);
        });

        // When a player joins the lobby
        connection.on("PlayerJoined", (player: Player) => {
          console.log("Player joined:", player);

          setPlayers((prevPlayers) => {
            // prevent duplicate players
            if (prevPlayers.some((p) => p.id === player.id)) {
              return prevPlayers;
            }
            // prevent adding more than 2 players
            if (prevPlayers.length >= 2) {
              return prevPlayers;
            }

            return [...prevPlayers, player];
          });
        });

        // When a player becomes ready
        connection.on("PlayerReady", (playerId: string) => {
          setPlayers((prevPlayers) =>
            prevPlayers.map((p) =>
              p.id === playerId ? { ...p, isReady: true } : p,
            ),
          );
        });

        // When the host starts the game
        connection.on("GameStarted", (lobbyId: string, mode: string) => {
          if (mode === 'blitz') {
            navigate('/classic-game');
          } else {
            navigate(`/game/${lobbyId}`);
          }
        });
      })
      .catch((err) => console.error("SignalR error:", err));

    // Cleanup when component unmounts
    return () => {
      connection.off("PlayerJoined");
      connection.off("PlayerReady");
      connection.off("GameStarted");
      connection.stop();
    };
  }, [realLobbyId, navigate]);

  // state to hold any error or status message from the backend
  const [message, setMessage] = useState<string | null>(null);

  // Clear the message after 3 seconds
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="page">
      <div className="container">
        <div className="col">
          <h1 className="title">VÄLJ EN KARAKTÄR</h1>

          {selectedPlayerName && (
            <div className="player-box" style={{marginBottom: "20px"}}>
              <p>Ditt namn: {selectedPlayerName}</p>
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
                Kopiera inbjudningslänk
              </button>
            </div>
          )}

          {/* Character carousel */}
          {/* Character carousel */}
          {loadingCharacters ? (
            <p style={{ color: "#fff", margin: "40px 0", fontSize: "1.2rem" }}>
              Laddar karaktärer...
            </p>
          ) : character ? (
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
                <div className="character-info">
                  <h2 className="character-name">{character.name}</h2>
                  <p className="character-description">{character.description}</p>
                  <span className="ability-badge">
                    ✦ {character.ability.effectDescription}
                  </span>
                </div>
              </div>

              <button className="ch-arrow" onClick={next}>
                <img src="/images/next.png" className="ch-arrow-img" />
              </button>
            </div>
          ) : (
            <p style={{ color: "red" }}>Kunde inte ladda karaktärer.</p>
          )}

          {/* Add bot button — host only, before ready, when lobby has only 1 player */}
          {isHost && !ready && players.length < 2 && (
            <button
              className="wm-modal-btn wm-modal-btn--cancel"
              style={{ marginBottom: "12px" }}
              onClick={async () => {
                const res = await fetch(
                  `http://127.0.0.1:5024/api/lobby/${realLobbyId}/add-bot`,
                  { method: "POST" }
                );
                if (!res.ok) {
                  const data = await res.json();
                  setMessage(data.error || "Kunde inte lägga till bot.");
                }
              }}
            >
              + Lägg till motståndare (Easy Bot)
            </button>
          )}

          {/* Game mode picker — host only, before ready */}
          {isHost && !ready && (
            <div className="game-mode-picker">
              <p className="game-mode-label">Välj spelläge</p>
              <div className="game-mode-btns">
                <button
                  className={`game-mode-btn ${gameMode === 'standard' ? 'active' : ''}`}
                  onClick={() => setGameMode('standard')}
                >
                  Standard WordMaster
                </button>
                <button
                  className={`game-mode-btn ${gameMode === 'blitz' ? 'active' : ''}`}
                  onClick={() => setGameMode('blitz')}
                >
                  Blitz WordMaster
                </button>
              </div>
            </div>
          )}

          {/* Show message from backend if exists */}
          {message && <div className="lobby-message">{message}</div>}

          {/* Ready/ Start button */}
          <button
            className={`ready-btn ${ready ? "isReady-btn" : ""}`}
            onClick={async () => {
              if (!ready) {
                // join lobby and mark as ready
                const response = await fetch(
                  `http://127.0.0.1:5024/api/lobby/${realLobbyId}/join`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: selectedPlayerName || character.name,
                      characterId: character.id,
                      isHost: isHost,
                    }),
                  },
                );

                // 1- try to join the lobby. If it fails (e.g. lobby is full), show an alert and return early
                if (!response.ok) {
                  const data = await response.json();
                  setMessage(
                    data.error ||
                      "Tyvärr är Lobbyn full och kan inte ta emot fler spelare.",
                  );
                  return;
                }

                const data = await response.json();
                const joinedPlayer = data.player; // we need the player info to mark them as ready in the next step
                localStorage.setItem('wordmaster-player-id', joinedPlayer.id)
                // 2- mark the player as ready. This will trigger the PlayerReady event in SignalR, which will update the UI for all players in the lobby to show that this player is ready.
                await fetch(
                  `http://127.0.0.1:5024/api/lobby/${realLobbyId}/ready/${joinedPlayer.id}`,
                  { method: "POST" },
                );

                setReady(true);
              } else {
                if (isHost) {
                  if (players.length < 2) {
                    setMessage(
                      "Väntar på att den andra spelaren ska gå med...",
                    );
                    return;
                  }

                  // 3- if the player is the host and clicks the button when they are already ready, we try to start the game. If starting the game fails (e.g. because not all players are ready), we show an alert with the error message from the backend.
                  const startResponse = await fetch(
                    `http://127.0.0.1:5024/api/lobby/${realLobbyId}/start`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ gameMode }),
                    },
                  );

                  // If starting the game fails, show an alert with the error message from the backend (e.g. "Players not ready")
                  if (!startResponse.ok) {
                    const errorMsg = await startResponse.text();
                    setMessage("Kunde inte starta: " + errorMsg); // Här ser du om backenden säger "Players not ready"
                  }
                }
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
                <b>Ugglan:</b> Får +3 poäng för varje giltig ord som är längre än 8 bokstäver.
                <br />
                <b>Leopard:</b> Får +3 poäng om ett giltigt ord ckickas in inom 10 sekunder.
                <br />
                <b>Musen:</b> Får +1 poäng för varje giltigt ord som är kortare än 4 bokstäver.
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