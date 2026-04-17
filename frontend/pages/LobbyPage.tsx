import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Character } from "../src/interfaces/interface.tsx";
import type Player from "../src/interfaces/Player.ts";
import "../css/lobby.css";
import * as signalR from "@microsoft/signalr";

/*
   Name Modal — supports 3 entry modes:
   - host: name only
   - invite: name only
   - join: name + lobby code
 */
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

// Map backend character ID → local image path
const CHARACTER_IMAGES: Record<string, string> = {
  ugglan:   "/images/owl.png",
  leopard:  "/images/leo.png",
  musen:    "/images/mouse.png",
  björnen:  "/images/bear.png",
};

/*
   Lobby Page
 */
export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  /*
     Determine entry mode:
     - host: came from CreateModal
     - join: came from JoinModal
     - invite: direct URL access
 */
  const entryMode: "host" | "join" | "invite" =
    location.state?.isHost === true
      ? "host"
      : location.state?.isHost === false
        ? "join"
        : lobbyId
          ? "invite"
          : "invite";

  const selectedPlayerName =
    location.state?.playerName?.trim() ||
    localStorage.getItem("wordmaster-player-name")?.trim() ||
    "";

  /*

 Lobby state and  Player identity
*/

  const [realLobbyId, setRealLobbyId] = useState<string>(""); ////── Lobby state

  // State för att hålla koll på spelare i lobbyn

  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(
    localStorage.getItem("playerId"),
  );
  const [isHost, setIsHost] = useState<boolean>(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ── Character state ──────────────────────────────────────────
  const [characters, setCharacters] = useState<Character[]>([]);

  const [loadingCharacters, setLoadingCharacters] = useState(true);

  // Ensure host & invite links always have lobbyId
  useEffect(() => {
    if (lobbyId) {
      setRealLobbyId(lobbyId);
    }
  }, [lobbyId]);
  
  /*
     Clean old playerId when entering via invite link
     (prevents incorrect host/guest behavior)
 */
  useEffect(() => {
    if (entryMode === "invite") {
      localStorage.removeItem("playerId");
      localStorage.removeItem("isHost");
    }
  }, [entryMode]);

  // Player name handling
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

  // Fetch Characters
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch("/api/character");
        if (res.ok) {
          const data = await res.json();
          const withImages: Character[] = data.map(
            (c: Omit<Character, "image">) => ({
              ...c,
              image: CHARACTER_IMAGES[c.id] ?? "/images/owl.png",
            }),
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

  /*
     Character carousel
  */
  const [index, setIndex] = useState(0); // för att ha koll på vilken karaktär visas

  const character = characters[index];
  const prev = () =>
    setIndex((i) => (i - 1 + characters.length) % characters.length);
  const next = () => setIndex((i) => (i + 1) % characters.length);

  //Game mode
  const [gameMode, setGameMode] = useState<"standard" | "blitz">("standard");

  /*
     Info box
 */
  const [open, setOpen] = useState(false);
  const infoBoxRef = useRef<HTMLDivElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);

  /*
     Auto-clear message
 */
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  /*
     Close info box on outside click
  */
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

  /*
     Fetch lobby data from backend
     - Determines real playerId, isHost, isReady
     - Ensures frontend trusts backend as the source of truth
 */
  useEffect(() => {
    if (!realLobbyId || !playerName) return;

    const fetchLobby = async () => {
      try {
        const res = await fetch(
          `/api/lobby/${realLobbyId}`,
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
          localStorage.setItem("wordmaster-player-id", me.id);
          setIsHost(me.isHost);
          setReady(me.isReady);
          localStorage.setItem("isHost", me.isHost.toString());
        }
      } catch (err) {
        console.error("Faild to fetch lobby", err);
        setMessage("Kunde inte hämta lobbyn. Försök igen.");
      }
    };

    fetchLobby();
  }, [realLobbyId, playerName]);

  /*
     SignalR connection
 */
useEffect(() => {
  if (!realLobbyId) return;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl("/lobbyHub")
    .withAutomaticReconnect()
    .build();

  connection
    .start()
    .then(async () => {
      await connection.invoke("JoinLobbyGroup", realLobbyId);

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
        if (mode === "blitz") {
          navigate("/classic-game");
        } else {
          navigate(`/game/${lobbyId}`);
        }
      });

      // When the lobby is reset for a new round
      connection.on("LobbyReset", (resetLobbyId: string) => {
        if (resetLobbyId === realLobbyId) {
          console.log("Lobby reset received");

          // Reset frontend state
          setReady(false);
          setPlayers([]);
          setMessage(null);

          // Navigate back to lobby page (Ready screen)
          navigate(`/lobby/${realLobbyId}`);
        }
      });
    })
    .catch((err) => console.error("SignalR error:", err));

  // Cleanup when component unmounts
  return () => {
    connection.stop();
  };
}, [realLobbyId, navigate]);

  /*
     Handle Ready:
     - Host: only send ready
     - Guest: always attempt join first
       (backend will reuse existing player if already joined)
 */
  const handleReady = async () => {
    // HOST => only send ready
    if (isHost) {
      await fetch(
        `/api/lobby/${realLobbyId}/ready/${playerId}`,
        { method: "POST" },
      );
      setReady(true);
      return;
    }

    // GUEST => always attempt join
    const joinRes = await fetch(
      `/api/lobby/${realLobbyId}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName }),
      },
    );

    const data = await joinRes.json();

    if (!joinRes.ok) {
      setMessage(data.error || "Ett fel uppstår, kunde inte joina lobbyn");
      return;
    }

    // Use the returned playerId immediately
    const newId = data.player.id;
    setPlayerId(newId);
    localStorage.setItem("wordmaster-player-id", newId);
    localStorage.setItem("playerId", newId);

    // Send ready immediately after join
    await fetch(
      `/api/lobby/${realLobbyId}/ready/${newId}`,
      {
        method: "POST",
      },
    );

    setReady(true);
  };

  /*
     Show modal if name not set
  */

  if (showNameModal) {
    return (
      <NameModal
        mode={entryMode}
        lobbyIdFromUrl={lobbyId}
        onConfirm={(name, code) => {
          localStorage.setItem("wordmaster-player-name", name);
          setPlayerName(name);

          // Never change realLobbyId if it is the host
          if (entryMode === "host") {
            setShowNameModal(false);
            return;
          }

          // Only if it's a guest
          setRealLobbyId(code || lobbyId || "");
          setShowNameModal(false);
        }}
      />
    );
  }

  /*
     Copy invite link
  */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Länk kopierad!");
  };

  if (!playerName) return null;

  // UI Rendering

  return (
    <div className="page">
      <div className="container">
        <div className="col">
          <h1 className="title">VÄLJ EN KARAKTÄR</h1>

          <div className="player-box" style={{ marginBottom: "20px" }}>
            <p>Dit namn: {playerName}</p>
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
                  <p className="character-description">
                    {character.description}
                  </p>
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

          {/* Add bot button — host only */}
          {isHost && !ready && players.length < 2 && (
            <button
              className="wm-modal-btn wm-modal-btn--cancel"
              style={{ marginBottom: "12px" }}
              onClick={async () => {
                const res = await fetch(
                  `/api/lobby/${realLobbyId}/add-bot`,
                  { method: "POST" },
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

          {/* Game mode picker — host only */}
          {isHost && !ready && (
            <div className="game-mode-picker">
              <p className="game-mode-label">Välj spelläge</p>
              <div className="game-mode-btns">
                <button
                  className={`game-mode-btn ${
                    gameMode === "standard" ? "active" : ""
                  }`}
                  onClick={() => setGameMode("standard")}
                >
                  Standard WordMaster
                </button>
                <button
                  className={`game-mode-btn ${
                    gameMode === "blitz" ? "active" : ""
                  }`}
                  onClick={() => setGameMode("blitz")}
                >
                  Blitz WordMaster
                </button>
              </div>
            </div>
          )}

          {message && <div className="lobby-message">{message}</div>}

          {/* Ready / Start button */}
          <button
            className={`ready-btn ${ready ? "isReady-btn" : ""}`}
            onClick={async () => {
              // FIRST CLICK → not ready yet
              if (!ready) {
                // HOST → send ready only
                if (isHost) {
                  await handleReady();
                  return;
                }

                // GUEST → join then ready
                const response = await fetch(
                  `/api/lobby/${realLobbyId}/join`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: selectedPlayerName || character.name,
                      characterId: character.id,
                      isHost: false,
                    }),
                  },
                );

                if (!response.ok) {
                  const data = await response.json();
                  setMessage(
                    data.error ||
                      "Tyvärr är Lobbyn full och kan inte ta emot fler spelare.",
                  );
                  return;
                }

                const data = await response.json();
                const joinedPlayer = data.player;

                localStorage.setItem("wordmaster-player-id", joinedPlayer.id);
                setPlayerId(joinedPlayer.id);

                await fetch(
                  `/api/lobby/${realLobbyId}/ready/${joinedPlayer.id}`,
                  { method: "POST" },
                );

                setReady(true);
                return;
              }

              // SECOND CLICK → host starts the game
              if (isHost) {
                if (players.length < 2) {
                  setMessage("Väntar på att den andra spelaren ska gå med...");
                  return;
                }

                const startResponse = await fetch(
                  `/api/lobby/${realLobbyId}/start`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gameMode }),
                  },
                );

                if (!startResponse.ok) {
                  const errorMsg = await startResponse.text();
                  setMessage("Kunde inte starta: " + errorMsg);
                }
              }
            }}
          >
            {ready ? "Starta spelet" : "Redo"}
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