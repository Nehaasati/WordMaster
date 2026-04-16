import { useState, useEffect } from "react";
import type { GameState, SubmitResponse } from "./GameState";
import "./gamepage.css";

export default function ClassicGamePage() {
  const API_BASE = "http://127.0.0.1:5024/api/classic";

  const [gameState, setGameState] = useState<GameState>({
    currentCategory: "",
    requiredLetter: "",
  });

  const [word, setWord] = useState("");
  const [feedback, setFeedback] = useState("");

  const [backendConnected, setBackendConnected] = useState<boolean | null>(
    null,
  );

  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);

  const [suggestedLetters, setSuggestedLetters] = useState<string[]>([]);
  const [targetWord, setTargetWord] = useState<string>("");
  const [revealedCount, setRevealedCount] = useState(1);

  // -----------------------------
  // Backend health check
  // -----------------------------
  const checkBackend = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5024/api/health");
      setBackendConnected(res.ok);
    } catch {
      setBackendConnected(false);
    }
  };

  // -----------------------------
  // Get game state
  // -----------------------------
  const fetchGameState = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/state`);

      if (!res.ok) return;

      const data: GameState = await res.json();

      setGameState(data);

      await fetchSuggestedLetters(data.currentCategory);
    } catch {
      console.error("Failed to fetch game state");
    }
  };

  // -----------------------------
  // Get suggested letters
  // -----------------------------
  const fetchSuggestedLetters = async (category: string) => {
    if (!category) return;

    try {
      const res = await fetch(
        `${API_BASE}/game/suggested-letters?category=${encodeURIComponent(category)}&count=15`,
      );

      if (!res.ok) return;

      const data = await res.json();

      setSuggestedLetters(data.suggestedLetters);
      setTargetWord(data.targetWord ?? "");
      setRevealedCount(1);
    } catch {
      console.error("Failed to fetch suggested letters");
    }
  };

  // -----------------------------
  // Skip category
  // -----------------------------
  const skipCategory = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/skip`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      const newState = { currentCategory: data.currentCategory, requiredLetter: data.requiredLetter };
      setGameState(newState);
      setWord("");
      setFeedback("");
      await fetchSuggestedLetters(newState.currentCategory);
    } catch {
      console.error("Failed to skip");
    }
  };

  // -----------------------------
  // Init
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      await checkBackend();

      await fetchGameState();
    };

    init();

    const interval = setInterval(checkBackend, 5000);

    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  // Timer
  // -----------------------------
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // -----------------------------
  // Submit word
  // -----------------------------
  const submitWord = async () => {
    if (!word.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/game/submit-word`, {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ word }),
      });

      if (!res.ok) {
        setFeedback("Server error");

        return;
      }

      const data: SubmitResponse = await res.json();

      setFeedback(data.message);

      if (data.isValid) {
        setScore((s) => s + 10);

        const newState = {
          currentCategory: data.nextCategory,

          requiredLetter: data.requiredLetter,
        };

        setGameState(newState);

        setWord("");

        fetchSuggestedLetters(newState.currentCategory);
      }
    } catch {
      setFeedback("Connection error");
    }
  };

  // -----------------------------
  // Next round
  // -----------------------------
  const nextRound = async () => {
    setRound((r) => r + 1);

    setTimeLeft(30);

    setFeedback("");

    setWord("");

    await fetchGameState();
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="wm-scene game-page">
      <div className="wm-bg" />

      <div className="wm-overlay" />

      <div className="wm-vignette" />

      <div className="wm-ui">
        <div className="backend-status">
          Backend:{" "}
          {backendConnected === null
            ? "Checking..."
            : backendConnected
              ? "Connected"
              : "Disconnected"}
        </div>

        <h1 className="wm-title">WordMaster</h1>

        <div className="wm-status-bar">
          <div className="wm-status-item">Poäng: {score}</div>

          <div className="wm-status-item">Omgång: {round}</div>

          <div
            className={`wm-status-item wm-timer ${timeLeft <= 5 ? "danger" : ""}`}
          >
            Tid kvar: {timeLeft}s
          </div>
        </div>

        <div className="wm-info-box">
          <div className="wm-info-label">Kategori</div>
          <div className="wm-info-value">{gameState.currentCategory}</div>
          <div className="wm-info-label">Ord</div>
          <div className="wm-info-value wm-hint-row">
            {targetWord.split("").map((char, i) => (
              <span key={i} className="wm-hint-char">
                {i < revealedCount ? char : "_"}
              </span>
            ))}
          </div>
        </div>

        <input
          type="text"
          className="wm-input"
          value={word}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            if (val.length > word.length) {
              const addedChar = val[val.length - 1];
              const charCountInWord = val.split("").filter((c) => c === addedChar).length;
              const charCountInPool = suggestedLetters.filter((c) => c === addedChar).length;
              if (charCountInPool < charCountInWord) return;
            }
            setWord(val);
          }}
          onKeyDown={(e) => e.key === "Enter" && submitWord()}
          placeholder="Skriv ditt ord..."
        />

        <div
          className={`wm-letter-bubbles category-${gameState.currentCategory}`}
        >
          {(() => {
            const pool = [...suggestedLetters];
            const used: boolean[] = new Array(pool.length).fill(false);
            for (const char of word.toUpperCase()) {
              const idx = pool.findIndex((l, i) => !used[i] && l === char);
              if (idx !== -1) used[idx] = true;
            }
            return suggestedLetters.map((letter, i) => (
              <div key={i} className={`wm-bubble${used[i] ? " wm-bubble--used" : ""}`}>
                {letter}
              </div>
            ));
          })()}
        </div>

        <div className="wm-action-row">
          <button className="wm-btn wm-btn--secondary" onClick={skipCategory}>
            Skippa
          </button>
          <button
            className="wm-btn wm-btn--secondary"
            onClick={() => setRevealedCount((c) => Math.min(c + 1, targetWord.length))}
            disabled={revealedCount >= targetWord.length}
          >
            Ge en bokstav
          </button>
        </div>

        <button className="wm-btn" onClick={submitWord}>
          Skicka
        </button>

        <div className="wm-feedback">{feedback}</div>

        <button className="wm-btn wm-next-btn" onClick={nextRound}>
          Nästa omgång
        </button>
      </div>
    </div>
  );
}
