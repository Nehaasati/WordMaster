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
            if (data.players)
            {
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

  // SignalR-anslutning
  useEffect(() => {
    if (!realLobbyId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://127.0.0.1:5024/lobbyHub")
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log("Connected to SignalR");

        // Gå med i lobbygruppen
        connection.invoke("JoinLobbyGroup", realLobbyId);

        // Lyssna på händelsen när en spelare går med i lobbyn
        connection.on("PlayerJoined", (player: Player) => {
            console.log("Player joined:", player);
            
            // Uppdatera spelarläget när en ny spelare går med
            setPlayers((prevPlayers) => [...prevPlayers, player]);
        });
      })
      .catch((err) => console.error("SignalR error:", err));

    // Rensa upp anslutningen när komponenten avmonteras
    return () => {
      connection.stop();
    };
  }, [realLobbyId]);

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
                  Spelare {index + 1}: {p.name}
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

          {/* Ready/ Start button */}
          <button
            className={`ready-btn ${ready ? "isReady-btn" : ""}`}
            onClick={async () => {
                if (!ready) {
                    setReady(true);

                    // skicka POST-förfrågan för att gå med i lobbyn
                    await fetch(
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
                } else {
                    if (isHost) {
                        navigate(`/game/${lobbyId || ""}`);
                    }
                }
            }}
          >
            {ready ? (isHost ? "Starta spelet" : "Väntar på värden...") : "Redo"}
          </button>
        </div>
      </div>
    </div>
  );
}