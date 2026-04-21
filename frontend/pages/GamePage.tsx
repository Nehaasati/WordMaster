import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { StarData, Category } from "../interfaces/Gamepage";
import { useGameEngine } from "../hooks/useGameEngine";
import { useSignalRGame } from "../hooks/useSignalRGame";
import { useSignalR } from "../hooks/SignalRContext";
import {
  handleRestart,
  handleFreeze,
  handleFreezePowerup,
  handleMix,
} from "../services/gameService";
import { updateUsedLetters } from "../services/wordValidator";
import "../css/GamePage.css";
import ShopPanel from "./Shoppanel";
///Star annimation
const STATIC_STARS: StarData[] = Array.from({ length: 60 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  d: (2 + Math.random() * 4).toFixed(1) + "s",
  del: (Math.random() * 5).toFixed(1) + "s",
  min: (0.2 + Math.random() * 0.3).toFixed(2),
}));

const Stars: React.FC = () => {
  return (
    <div className="gp-stars">
      {STATIC_STARS.map((s) => (
        <div
          key={s.id}
          className="gp-star"
          style={
            {
              left: s.left + "%",
              top: s.top + "%",
              width: s.size + "px",
              height: s.size + "px",
              ["--d" as string]: s.d,
              ["--del" as string]: s.del,
              ["--min" as string]: s.min,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
const CATEGORY_LIST: Category[] = [
  { id: "Name", label: "Namn" },
  { id: "Food", label: "Mat" },
  { id: "Job", label: "Jobb" },
  { id: "Land", label: "Land" },
  { id: "Colour", label: "Färg" },
  { id: "Animal", label: "Djur" },
  { id: "Object", label: "Sak" },
];
const GamePage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();

  // Get the shared SignalR connection
  const connection = useSignalR();

  // Additional state not covered by the hook
  const [frozen, setFrozen] = useState(false);
  const [freezeMsg, setFreezeMsg] = useState("");
  const [showInk, setShowInk] = useState(false);
  const [gameStopped, setGameStopped] = useState(false);
  const [inkActive, setInkActive] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [toast, setToast] = useState<string>("");
  const [isHost, setIsHost] = useState(
    localStorage.getItem("isHost") === "true",
  );

  // Use SignalR hook for real-time events
  const { submitWord, stopGame, finishGame } = useSignalRGame(lobbyId, {
    onLobbyReset: async () => {
      console.log("Lobby reset → new round");

      resetRound();

      // reset categories

      resetCategories();

      // fetch new letters
      const res = await fetch(`/api/lobby/${lobbyId}`);
      if (res.ok) {
        const data = await res.json();
        setAllLetters(
          data.letters.map((char: string) => ({
            id: Math.random().toString(36),
            char,
            used: false,
            isExtra: false,
          })),
        );
      }
    },
    onPlayerLeft: (playerId: string) => {
      console.log("Player left:", playerId);

      const myId = localStorage.getItem("wordmaster-player-id");

      if (playerId !== myId) {
        setToast("En spelare lämnade lobbyn");
        setTimeout(() => setToast(""), 3000);
      }
    },

    onGameStopped: (lId: string, _stoppedBy: string, scores: Record<string, number>) => {
      setGameStopped(true);
      setStopped(true);
      const myId = localStorage.getItem("wordmaster-player-id") ?? "";
      const finalScore = scores?.[myId] ?? scoreRef.current;
      setScore(finalScore);
      scoreRef.current = finalScore;
      setTimeout(() => {
        navigate(`/result/${lId}`, { state: { gameStopped: true } });
      }, 2500);
    },
    onHostChanged: (newHostId: string) => {
      const myId = localStorage.getItem("wordmaster-player-id");

      if (myId === newHostId) {
        localStorage.setItem("isHost", "true");
        setIsHost(true);
      } else {
        setIsHost(false);
      }
    },
    onMatchEnded: (lId: string, scores: Record<string, number>) => {
      setStopped(true);
      const myId = localStorage.getItem("wordmaster-player-id") ?? "";
      const finalScore = scores?.[myId] ?? scoreRef.current;
      setScore(finalScore);
      scoreRef.current = finalScore;
      setTimeout(() => {
        navigate(`/result/${lId}`, { state: { gameStopped: false } });
      }, 3000);
    },
    onWordSubmitted: (_senderId: string, _category: string, _word: string) => {
    },
    onScoreUpdate: (update: { totalScores: Record<string, number>; categoryPoints: Record<string, Record<string, number>> }) => {
      const myId = localStorage.getItem("wordmaster-player-id") ?? "";
      const myTotal = update.totalScores?.[myId] ?? 0;
      setScore(myTotal);
      scoreRef.current = myTotal;
      const myCategoryPoints = update.categoryPoints?.[myId] ?? {};
      setCategoryPoints(myCategoryPoints);
    },
    // Added handlers for abilities (freeze and ink)
    onFreezeReceived: () => {
      handleFreezeLocal(); // your existing freeze UI logic
    },

    onInkReceived: () => {
      setShowInk(true);
      setInkActive(true);

      setTimeout(() => {
        setShowInk(false);
        setInkActive(false);
      }, 10000); // 10 seconds duration heeej
    },
  });

  // Use the game engine hook for state management
  const {
    categories,
    setCategories,
    resetCategories,
    resetRound,
    allLetters,
    setAllLetters,
    timeLeft,
    score,
    setScore,
    stopped,
    setStopped,
    categoryPoints,
    setCategoryPoints,
    scoreRef,
    validateWord,
    buildAvailablePool,
  } = useGameEngine(lobbyId, submitWord);

  // Automatic focus shift to next category when one is completed
  const validStates = CATEGORY_LIST.map(
    (cat) => categories[cat.id]?.valid,
  ).join(",");

  useEffect(() => {
    const nextCat = CATEGORY_LIST.find((cat) => !categories[cat.id]?.valid);
    if (nextCat) {
      inputRefs.current[nextCat.id]?.focus();
    }
  }, [validStates]);

  useEffect(() => {
    updateUsedLetters(categories, setAllLetters);
  }, [categories, setAllLetters]);

  // Calculate score whenever categories, categoryPoints, or bonus changes
  // Note: refs are intentionally excluded from dependencies as they don't trigger re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps

 const handleInputChange = (
   categoryId: string,
   e: React.ChangeEvent<HTMLInputElement>,
 ) => {
   if (frozen || stopped) return;

   const raw = e.target.value.toUpperCase();

   // Build available pool BEFORE updating state
   const pool = buildAvailablePool(categoryId);

   // Filter out letters not in pool
   let filtered = "";
   const tempPool = [...pool];

   for (const char of raw) {
     const index = tempPool.indexOf(char);
     if (index !== -1) {
       filtered += char;
       tempPool.splice(index, 1); // remove used letter
     }
   }

   // Update UI immediately with filtered value
   setCategories((prev) => {
     const updated = {
       ...prev,
       [categoryId]: {
         ...prev[categoryId],
         word: filtered,
         valid: false,
         feedback: "",
       },
     };

     // Validate AFTER state update
     setTimeout(() => {
       validateWord(filtered, categoryId);
     }, 0);

     return updated;
   });
 };
  const handleFreezeLocal = () => {
    handleFreeze(setFrozen, setFreezeActive, setShowFreeze, setFreezeMsg);
  };

  const handleFreezePowerupLocal = () => {
    handleFreezePowerup(lobbyId, connection, handleFreezeLocal);
  };

  const handleMixLocal = () => {
    handleMix(setAllLetters);
  };

  const handleRestartLocal = async () => {
    await handleRestart(lobbyId);
  };

  // The classic game

  /*const handleFinishClassic = () => {
    setStopped(true);
  };
*/
  const allDone = CATEGORY_LIST.every((c) => categories[c.id]?.valid);

  //Send all done to backend
  useEffect(() => {
    const notifyFinished = async () => {
      if (allDone && !stopped) {
        finishGame();
        const playerId = localStorage.getItem("wordmaster-player-id");
        if (playerId && lobbyId) {
          fetch(`/api/lobby/${lobbyId}/player-finished/${playerId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoriesCompleted: true, score: score }),
          }).catch((err) => console.error("API Finish Error:", err));
        }
      }
    };
    
    notifyFinished();
  }, [allDone, stopped, lobbyId, scoreRef]);

  return (
    <div className="gp-scene" data-testid="game-page">
      <div className="gp-bg" />
      <Stars />
      {toast && <div className="gp-toast">{toast}</div>}

      {/* Top bar */}
      <div className="gp-top-bar">
        {isHost && <div className="gp-host">Värden</div>}
        <div className="gp-freeze-msg" data-testid="freeze-msg">
          {freezeMsg}
        </div>
        <div className="gp-timer" data-testid="timer">
          TID: {timeLeft} sekunder
        </div>
      </div>

      {/* Score */}
      <div className="gp-score" data-testid="score">
        <span className="gp-score-emoji">💰</span>
        POÄNG: {score}
        <span className="gp-score-emoji">💰</span>
      </div>

      {/* Classic game stop button */}
      {!lobbyId && !stopped && (
        <button
          className="gp-btn gp-btn--finish"
          onClick={() => setStopped(true)}
        >
          Avsluta Spel
        </button>
      )}

      {/* Powerups */}
      <div className="gp-powerups">
        <button
          className="gp-btn gp-btn--freeze"
          onClick={handleFreezePowerupLocal}
          data-testid="btn-freeze"
        >
          Freeze
        </button>

        <button
          className="gp-btn gp-btn--black"
          onClick={() => connection?.invoke("UseInk", lobbyId)}
          data-testid="btn-black"
        >
          Bläck
        </button>

        <button
          className="gp-btn gp-btn--mix"
          onClick={handleMixLocal}
          data-testid="btn-mix"
        >
          Mix
        </button>

        {lobbyId && !stopped && (
          <button
            className="gp-btn gp-btn--stop"
            onClick={() => stopGame()}
            data-testid="btn-stop"
          >
            Stopp
          </button>
        )}
      </div>

      {/* Main content */}
      <ShopPanel
        score={score}
        onBuyLetter={(letter: string, cost: number) => {
          setScore((prev) => prev - cost);
          setAllLetters((prev) => [
            ...prev,
            {
              id:
                Math.random().toString(36).substr(2, 9) +
                Date.now().toString(36),
              char: letter,
              used: false,
              isExtra: true,
            },
          ]);
        }}
        onBuyPowerup={(powerupId: string, cost: number) => {
          setScore((prev) => prev - cost);
          if (powerupId === "freeze") handleFreezeLocal();
          if (powerupId === "mix") handleMixLocal();
        }}
      />
      <div className="gp-content">
        <div className="gp-left-spacer" />

        {/* Categories */}
        <div className="gp-categories" data-testid="categories">
          {CATEGORY_LIST.map((cat) => (
            <div className="gp-cat-row" key={cat.id}>
              <label className="gp-cat-label">{cat.label}:</label>

              <div className="gp-cat-input-wrap">
                <input
                  type="text"
                  ref={(el) => {
                    if (el) inputRefs.current[cat.id] = el;
                  }}
                  className={`gp-cat-input ${
                    categories[cat.id].valid ? "gp-cat-input--valid" : ""
                  }`}
                  value={categories[cat.id].word}
                  onChange={(e) => handleInputChange(cat.id, e)}
                  disabled={categories[cat.id].valid || frozen || stopped}
                  data-testid={`input-${cat.id}`}
                />
                {categories[cat.id].valid && lobbyId && categoryPoints[cat.id] !== undefined && (
                  <span
                    style={{ color: categoryPoints[cat.id] === 5 ? "#ff8c00" : "#4caf50" }}
                    title={categoryPoints[cat.id] === 5 ? "Samma ord som motståndaren – 5p" : "Unikt ord – 10p"}
                  >
                    {categoryPoints[cat.id] === 5 ? "5p" : "10p"}
                  </span>
                )}

                {categories[cat.id].feedback && (
                  <span
                    className="gp-feedback"
                    data-testid={`feedback-${cat.id}`}
                  >
                    {categories[cat.id].feedback}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Letters */}
        <div className="gp-right">
          <div className="gp-letters" data-testid="letters">
            {allLetters.map((letter) => (
              <div
                key={letter.id}
                className={`gp-letter ${
                  letter.isExtra ? "gp-letter--extra" : ""
                } ${letter.used ? "gp-letter--used" : ""}`}
                data-testid="letter-tile"
              >
                {letter.char}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ink animation */}
      {showInk && (
        <video
          src="/videos/Bläck.webm"
          autoPlay
          muted
          className={`gp-overlay-video ${
            inkActive ? "gp-overlay-video--visible" : ""
          }`}
          onEnded={() => {
            setInkActive(false);
            setTimeout(() => setShowInk(false), 400);
          }}
        />
      )}

      {/* Freeze animation */}
      {showFreeze && (
        <video
          src="/videos/Freeze5Sec.webm"
          autoPlay
          muted
          className={`gp-overlay-video ${
            freezeActive ? "gp-overlay-video--visible" : ""
          }`}
        />
      )}

      {/* Stopped overlay */}
      {stopped && (
        <div className="gp-stopped-overlay" data-testid="stopped-overlay">
          <div className="gp-stopped-card">
            <h2>{gameStopped ? "Spelet avbröts!" : "Stopp!"}</h2>
            {gameStopped && (
              <p style={{ color: "#ff8c00", fontWeight: "bold" }}>
                En spelare tryckte på Stopp. Vidarebefordrar till
                resultatsidan...
              </p>
            )}
            <p>Din tid: {timeLeft} sekunder</p>
            <p>Din poäng: {score}</p>

            {/* Restart button (ONLY HOST) */}
            {lobbyId && localStorage.getItem("isHost") === "true" && (
              <button
                className="gp-btn"
                onClick={handleRestartLocal}
                style={{
                  marginTop: "15px",
                  width: "100%",
                  backgroundColor: "#2ecc71",
                }}
              >
                Starta ny runda
              </button>
            )}

            {/* Classic mode */}
            {!lobbyId && (
              <button
                className="gp-btn"
                onClick={() => navigate("/")}
                style={{
                  marginTop: "15px",
                  width: "100%",
                }}
              >
                Tillbaka till menyn
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
