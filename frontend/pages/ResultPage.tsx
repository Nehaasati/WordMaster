import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSignalR } from "../hooks/SignalRContext.ts";
import confetti from "canvas-confetti";
import "../css/ResultPage.css";

interface PlayerResult {
  id: string;
  name: string;
  score: number;
  characterId?: string;
}

export default function ResultPage() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  //const location = useLocation();
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restartVotes, setRestartVotes] = useState<string[]>([]);

  const connection = useSignalR();

  // const gameStopped: boolean = location.state?.gameStopped ?? false;
  const myPlayerId = localStorage.getItem("wordmaster-player-id") ?? "";

  useEffect(() => {
    if (!lobbyId) return;
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/lobby/${lobbyId}`);
        if (!res.ok) {
          setError("Kunde inte hämta resultat.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        const mapped: PlayerResult[] = (data.players ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          score: p.score ?? 0,
          characterId: p.characterId,
        }));
        mapped.sort((a, b) => b.score - a.score);
        setPlayers(mapped);
      } catch {
        setError("Anslutningsfel – kunde inte hämta resultat.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [lobbyId]);

  // SignalR connection handling
  useEffect(() => {
    if (!connection || !lobbyId) return;

    const handleLobbyReset = (resetLobbyId: string) => {
      if (resetLobbyId === lobbyId) {
        // Navigate back to lobby when reset occurs
        navigate(`/lobby/${lobbyId}`, { state: { fromResult: true } });
      }
    };

    const handlePlayerRestartVote = (playerId: string) => {
      setRestartVotes((prev) => {
        if (!prev.includes(playerId)) {
          return [...prev, playerId];
        }
        return prev;
      });
    };

    connection.on("LobbyReset", handleLobbyReset);
    connection.on("PlayerRestartVote", handlePlayerRestartVote);

    return () => {
      connection.off("LobbyReset", handleLobbyReset);
      connection.off("PlayerRestartVote", handlePlayerRestartVote);
    };
  }, [connection, lobbyId, navigate]);

  const winner = players[0] ?? null;
  const isWinner = winner?.id === myPlayerId;
  const isTie = players.length === 2 && players[0]?.score === players[1]?.score;

  // Confetti effect 
  useEffect(() => {
    if (!loading && !error && players.length > 0) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#7c3aed", "#4f46e5", "#fbbf24", "#10b981"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#7c3aed", "#4f46e5", "#fbbf24", "#10b981"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [loading, error, players]);

  return (
    <div className="rp-scene">
      <div className="rp-bg" />

      <div className="rp-content">
        <h1 className="rp-title">Resultat</h1>

        {loading && <p className="rp-loading">Hämtar resultat...</p>}
        {error && <p className="rp-error">{error}</p>}

        {!loading && !error && players.length > 0 && (
          <>
            <div className="rp-winner-box">
              {isTie ? (
                <>
                  <p className="rp-winner-text">Oavgjort!</p>
                </>
              ) : (
                <>
                  <p className="rp-winner-text">
                    {isWinner ? "Du vann! Grattis!" : `${winner.name} vann!`}
                  </p>
                </>
              )}
            </div>

            <div className="rp-scoreboard">
              {players.map((p, index) => {
                const isMe = p.id === myPlayerId;
                const isFirst = index === 0 && !isTie;
                return (
                  <div
                    key={p.id}
                    className={`rp-player-row ${isFirst ? "rp-player-row--winner" : ""} ${isMe ? "rp-player-row--me" : ""}`}
                  >
                    <span className="rp-player-name">
                      {p.name}
                      {isMe && <span className="rp-you-badge"> (du)</span>}
                    </span>
                    <span className="rp-player-score">{p.score} p</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="rp-actions">
          {restartVotes.length > 0 && (
            <p className="rp-restart-status">
              {restartVotes.length} av {players.length} spelare vill spela igen
            </p>
          )}
          <button
            className="rp-btn rp-btn--primary"
            onClick={async () => {
              const playerId = localStorage.getItem("wordmaster-player-id");
              if (!playerId) return;
              await fetch(
                `/api/lobby/${lobbyId}/restart?playerId=${playerId}`,
                {
                  method: "POST",
                },
              );
            }}
            disabled={restartVotes.includes(myPlayerId)}
          >
            {restartVotes.includes(myPlayerId)
              ? "Väntar på andra spelare..."
              : "Spela igen"}
          </button>
          <button
            className="rp-btn rp-btn--secondary"
            onClick={() => navigate("/")}
          >
            Tillbaka till menyn
          </button>
        </div>
      </div>
    </div>
  );
}
