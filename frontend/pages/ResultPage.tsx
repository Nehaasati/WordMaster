import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [players, setPlayers] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // const gameStopped: boolean = location.state?.gameStopped ?? false;
  const myPlayerId = localStorage.getItem("wordmaster-player-id") ?? "";

  useEffect(() => {
    if (!lobbyId) return;
    const fetchResults = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5024/api/lobby/${lobbyId}`);
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

  const winner = players[0] ?? null;
  const isWinner = winner?.id === myPlayerId;
  const isTie = players.length === 2 && players[0]?.score === players[1]?.score;

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
          <button
            className="rp-btn rp-btn--primary"
            onClick={() =>
              navigate(`/lobby/${lobbyId}`, {
                state: {
                  playerName: localStorage.getItem("wordmaster-player-name"),
                  isHost: localStorage.getItem("isHost") === "true",
                },
              })
            }
          >
            Spela igen
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