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
        const response = await fetch(`http://127.0.0.1:5024/api/lobby/${lobbyId}`);
        if (!response.ok) return;

        const data = await response.json();
        setRealLobbyId(data.id);

        if (data.players) {
          setPlayers(data.players);
          const me = data.players.find(
            (p: Player) => p.name.trim().toLowerCase() === selectedPlayerName.toLowerCase()
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
            prev.map((p) => (p.id === playerId ? { ...p, isReady: true } : p))
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
    if (!playerId || !realLobbyId) return;

    // Only guest join - the host is already inside the lobby
    if (!isHost) {
      const joinResponse = await fetch(
        http://127.0.0.1:5024/api/lobby/${realLobbyId}/join,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: selectedPlayerName }),
        }
      );

      if (!joinResponse.ok) {
        const data = await joinResponse.json();
        setMessage(data.error || "Lobbyn är full.");
        return;
      }

      const data = await joinResponse.json();
      setPlayerId(data.player.id);
      localStorage.setItem("playerId", data.player.id);
    }

    await fetch(
      `http://127.0.0.1:5024/api/lobby/${realLobbyId}/ready/${playerId}`,
      { method: "POST" }
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
      http://127.0.0.1:5024/api/lobby/${realLobbyId}/start/${playerId},
      { method: "POST" }
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







  // Om isHost inte skickas via navigation, defaulta till false
  const isHostFromNav = location.state?.isHost ?? false; // default till false om inte skickat från navigation
  const isHost = isHostFromNav; // sätt initialt värde baserat på navigation state
  const selectedPlayerName =
    location.state?.playerName?.trim() ||
    localStorage.getItem("wordmaster-player-name")?.trim() ||
    "";
  const [realLobbyId, setRealLobbyId] = useState<string>("");

  // State för att hålla koll på spelare i lobbyn
  const [players, setPlayers] = useState<Player[]>([]);

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

  const [index, setIndex] = useState(0); // för att ha koll på vilken karaktär visas
  const character = Characters[index]; //aktuella karaktären baserat på index
  const prev = () =>
    setIndex((i) => (i - 1 + Characters.length) % Characters.length); // + Characters.length för att undvika negativ index
  const next = () => setIndex((i) => (i + 1) % Characters.length); //i är nuvarande index och adderas med 1, % används för att hoppa tillbaka till första index

  const [ready, setReady] = useState(false);

  const shareUrl = window.location.href;

  const [open, setOpen] = useState(false);
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
        connection.on("GameStarted", (lobbyId: string) => {
          navigate(`/game/${lobbyId}`);
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
            <div className="player-box" style={{ marginBottom: "20px" }}>
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
                    { method: "POST" },
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
                <b>Ugglan:</b> Får +3 poäng för varje giltig ord som är längre
                än 8 bokstäver.
                <br />
                <b>Leopard:</b> Får +3 poäng om ett giltigt ord ckickas in inom
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