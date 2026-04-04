import { useState, useEffect } from "react";
import { GameState, SubmitResponse } from "../interfaces/GameState";
import "../css/_gamepage.css";

export default function GamePage() {
  const API_BASE = "http://127.0.0.1:5024/api";

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

  // -----------------------------
  // Backend health check
  // -----------------------------
  const checkBackend = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
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
    } catch {
      console.error("Failed to fetch suggested letters");
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

          <div className="wm-info-label">Bokstav</div>

          <div className="wm-info-value">{gameState.requiredLetter}</div>
        </div>

        <input
          type="text"
          className="wm-input"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Skriv ditt ord..."
        />

        {/* Suggested letters */}

        <div
          className={`wm-letter-bubbles category-${gameState.currentCategory}`}
        >
          {suggestedLetters.map((letter) => (
            <div key={letter} className="wm-bubble">
              {letter}
            </div>
          ))}
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