import {useState, useEffect} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { Character } from "../src/interfaces/interface.tsx";
import type Player from "../src/interfaces/Player.ts";
import "../css/lobby.css";
import * as signalR from "@microsoft/signalr";

const Characters: Character[] = [
    {id:1 , name:"Owl", image:"../images/owl.png"},
    {id:2 , name:"Leopard", image:"../images/leo.png"},
    {id:3 , name:"Mouse", image:"../images/mouse.png"},
    {id:4 , name:"Bear", image:"../images/bear.png"},
]

export default function LobbyPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  // Hämta isHost från navigation state
  const location = useLocation();
  // Om isHost inte skickas via navigation, defaulta till false
  const isHostFromNav = location.state?.isHost ?? false; // default till false om inte skickat från navigation
  const isHost = isHostFromNav; // sätt initialt värde baserat på navigation state

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
            <div
              className="lobby-info"
              style={{
                marginBottom: "30px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "center",
                background: "rgba(0, 0, 0, 0.45)",
                padding: "16px 32px",
                borderRadius: "16px",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(160, 80, 255, 0.25)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              }}
            >
              <p
                className="wm-modal-label"
                style={{
                  fontSize: "1.1rem",
                  color: "#fff",
                  letterSpacing: "0.1em",
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
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
                style={{
                  padding: "10px 24px",
                  width: "fit-content",
                  fontSize: "1rem",
                }}
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
          {message && (
            <div className="lobby-message">
              {message}
            </div>
          )}

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
                      name: character.name,
                      isHost: isHost,
                    }),
                  },
                );

                // 1- try to join the lobby. If it fails (e.g. lobby is full), show an alert and return early
                if (!response.ok) {
                  const data = await response.json();
                  setMessage(data.error || "Tyvärr är Lobbyn full och kan inte ta emot fler spelare.");
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
                    setMessage("Väntar på att den andra spelaren ska gå med...");
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
        </div>
      </div>
    </div>
  );
}