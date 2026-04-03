import { useState, useEffect } from "react";
import { GameState, SubmitResponse } from "../interfaces/GameState.ts";
import '../css/_gamepage.css';


export default function GamePage() {
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

  const API_BASE = "http://127.0.0.1:5024/api";

  const checkBackend = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      setBackendConnected(response.ok);
    } catch {
      setBackendConnected(false);
    }
  };

  const fetchGameState = async () => {
    try {
      const response = await fetch(`${API_BASE}/game/state`);
      if (response.ok) {
        const data: GameState = await response.json();
        setGameState(data);
      }
    } catch {
      console.error("Failed to fetch game state");
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkBackend();
      await fetchGameState();
    };
    init();

    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const submitWord = async () => {
    if (!word.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/game/submit-word`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      if (!response.ok) {
        setFeedback("Server error");
        return;
      }

      const data: SubmitResponse = await response.json();
      setFeedback(data.message);

      if (data.isValid) {
        setScore((s) => s + 10);
        setGameState({
          currentCategory: data.nextCategory,
          requiredLetter: data.requiredLetter,
        });
        setWord("");
      }
    } catch {
      setFeedback("Connection error");
    }
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setTimeLeft(30);
    setFeedback("");
    setWord("");
    fetchGameState();
  };

  return (
    <div className="wm-scene game-page">
      <div className="wm-bg" />
      <div className="wm-overlay" />
      <div className="wm-vignette" />

      <div className="wm-ui">

        {/* This will show the backend connection status */}
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