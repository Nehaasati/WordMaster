import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { StarData, Category } from "../interfaces/Gamepage";
import type { ShopApiResponse, ShopState } from "../interfaces/Shop";
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

const EMPTY_SHOP_STATE: ShopState = {
  balance: 0,
  earnedScore: 0,
  spentScore: 0,
  purchasedLetters: [],
  powerups: {},
  catalog: [],
};

const getCurrentPlayerId = () =>
  localStorage.getItem("wordmaster-player-id") ??
  localStorage.getItem("playerId") ??
  "";

const getShopErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Shop request failed";

const parseShopApiResponse = async (
  response: Response,
): Promise<ShopApiResponse> => {
  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new Error(
      data?.title ?? data?.message ?? `Shop request failed (${response.status})`,
    );
  }

  return data as ShopApiResponse;
};

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
  const [shopState, setShopState] = useState<ShopState>(EMPTY_SHOP_STATE);
  const [shopLoading, setShopLoading] = useState(Boolean(lobbyId));
  const [shopError, setShopError] = useState("");
  const shopSyncSeq = useRef(0);

  // Use SignalR hook for real-time events
  const { submitWord } = useSignalRGame(lobbyId, {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onGameStopped: (lId: string, _stoppedBy: string, _score: number) => {
      setGameStopped(true);
      setStopped(true);

      const myId = localStorage.getItem("wordmaster-player-id") ?? "";
      fetch(`/api/lobby/${lId}/save-score/${myId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            navigate(`/result/${lId}`, { state: { gameStopped: true } });
          }, 2500);
        });
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
    onMatchEnded: (lId: string) => {
      navigate(`/result/${lId}`);
    },
    onWordSubmitted: (senderId: string, category: string, word: string) => {
      // Update opponent words for scoring
      const myId = localStorage.getItem("wordmaster-player-id") ?? "";

      // Update opponent words for scoring
      const isMine = senderId === myId;
      // Save words
      if (isMine) {
        // Save my word for scoring
        myWordsRef.current[category] = word.toUpperCase();
      } else {
        if (!opponentWordsRef.current[category]) {
          opponentWordsRef.current[category] = new Set();
        }
        // Save opponent word for scoring
        opponentWordsRef.current[category].add(word.toUpperCase());
      }

      // Recalculate points EVERY TIME a word is submitted
      const myWord = myWordsRef.current[category];
      const opponentSet = opponentWordsRef.current[category] ?? new Set();
      let points = 0;
      if (!myWord || myWord.length < 2) {
        points = 0; // invalid or empty
      } else if (opponentSet.has(myWord)) {
        points = 5; // same word as opponent -- // duplicate -- 5p
      } else {
        points = 10; // unique word
      }

      setCategoryPoints((prev) => ({
        ...prev,
        [category]: points,
      }));
    },
    // Added handlers for abilities (freeze and ink)
    onFreezeReceived: async () => {
      await handleFreezeReceivedLocal();
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
    bonusRef,
    myWordsRef,
    opponentWordsRef,
    validateWord,
    buildAvailablePool,
  } = useGameEngine(lobbyId, submitWord);

  const applyShopState = React.useCallback((state: ShopState) => {
    setShopState(state);
    setScore(state.balance);
  }, [setScore]);

  const requireShopSession = () => {
    const playerId = getCurrentPlayerId();
    if (!lobbyId || !playerId) {
      throw new Error("Shop is only available after joining a lobby.");
    }

    return playerId;
  };

  const postShopAction = async (
    endpoint: "purchase" | "consume-powerup",
    body: Record<string, string>,
  ) => {
    const playerId = requireShopSession();
    setShopError("");

    const response = await fetch(
      `/api/lobby/${lobbyId}/shop/${playerId}/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await parseShopApiResponse(response);
    applyShopState(data.state);
    return data;
  };

  const purchaseShopItem = async (itemId: string) => {
    await postShopAction("purchase", { itemId });
  };

  const consumePowerup = async (powerupId: string) => {
    try {
      await postShopAction("consume-powerup", { powerupId });
      return true;
    } catch (err) {
      setShopError(getShopErrorMessage(err));
      return false;
    }
  };

  const getPowerupCount = (powerupId: string) =>
    shopState.powerups[powerupId] ?? 0;

  const calculateEarnedScore = React.useCallback(() => {
    let total = 0;
    for (const cat of CATEGORY_LIST) {
      const catData = categories[cat.id];
      if (!catData.valid) continue;
      const points = categoryPoints[cat.id] ?? 10;
      total += points;
    }

    return total + bonusRef.current;
  }, [bonusRef, categories, categoryPoints]);

  useEffect(() => {
    if (!lobbyId) {
      return;
    }

    let cancelled = false;
    const loadShopState = async () => {
      const playerId = getCurrentPlayerId();
      if (!playerId) {
        if (!cancelled) {
          setShopLoading(false);
          setShopError("Missing player session. Rejoin the lobby to use the shop.");
        }
        return;
      }

      setShopLoading(true);
      setShopError("");

      try {
        const response = await fetch(`/api/lobby/${lobbyId}/shop/${playerId}`);
        const data = await parseShopApiResponse(response);
        if (!cancelled) {
          applyShopState(data.state);
        }
      } catch (err) {
        if (!cancelled) {
          setShopError(getShopErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setShopLoading(false);
        }
      }
    };

    loadShopState();

    return () => {
      cancelled = true;
    };
  }, [applyShopState, lobbyId]);

  const purchasedLettersKey = shopState.purchasedLetters.join("|");

  useEffect(() => {
    const purchasedLetters = shopState.purchasedLetters;

    setAllLetters((prev) => {
      const currentShopLetters = prev
        .filter((letter) => letter.source === "shop")
        .map((letter) => letter.char)
        .join("|");

      if (currentShopLetters === purchasedLettersKey) {
        return prev;
      }

      const nonShopLetters = prev.filter((letter) => letter.source !== "shop");
      const shopLetters = purchasedLetters.map((char, index) => ({
        id: `shop-${index}-${char}`,
        char,
        used: false,
        isExtra: true,
        source: "shop" as const,
      }));

      return [...nonShopLetters, ...shopLetters];
    });
  }, [purchasedLettersKey, allLetters.length, setAllLetters, shopState.purchasedLetters]);

  // Automatic focus shift to next category when one is completed
  const validStates = CATEGORY_LIST.map(
    (cat) => categories[cat.id]?.valid,
  ).join(",");

  useEffect(() => {
    const nextCat = CATEGORY_LIST.find((cat) => !categories[cat.id]?.valid);
    if (nextCat) {
      inputRefs.current[nextCat.id]?.focus();
    }
  }, [categories, validStates]);

  useEffect(() => {
    updateUsedLetters(categories, setAllLetters);
  }, [categories, setAllLetters]);

  // Calculate earned score, then let the backend apply shop spending.
  useEffect(() => {
    const earnedScore = calculateEarnedScore();
    const playerId = getCurrentPlayerId();

    if (!lobbyId || !playerId) {
      setScore(earnedScore);
      return;
    }

    const syncId = ++shopSyncSeq.current;
    const syncShopScore = async () => {
      try {
        const response = await fetch(
          `/api/lobby/${lobbyId}/shop/${playerId}/sync-score`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ earnedScore }),
          },
        );

        const data = await parseShopApiResponse(response);
        if (syncId === shopSyncSeq.current) {
          applyShopState(data.state);
        }
      } catch (err) {
        if (syncId === shopSyncSeq.current) {
          setShopError(getShopErrorMessage(err));
        }
      }
    };

    syncShopScore();
  }, [applyShopState, calculateEarnedScore, lobbyId, setScore]);

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

  const isFreezeImmune = async () => {
    const characterId = localStorage.getItem("characterId");
    if (!characterId) return false;

    try {
      const res = await fetch(`/api/character/${characterId}/freeze-immune`);
      if (!res.ok) return false;

      const data = await res.json();
      return data.isFreezeImmune === true;
    } catch (err) {
      console.error("Freeze immunity check failed:", err);
      return false;
    }
  };

  const handleFreezeLocal = () => {
    handleFreeze(setFrozen, setFreezeActive, setShowFreeze, setFreezeMsg);
  };

  const handleFreezeReceivedLocal = async () => {
    if (await isFreezeImmune()) {
      setFrozen(false);
      setFreezeActive(false);
      setShowFreeze(false);
      setFreezeMsg("Björnen blockerade freeze!");
      setTimeout(() => setFreezeMsg(""), 2000);
      return;
    }

    handleFreezeLocal();
  };

  const handleFreezePowerupLocal = async () => {
    if (!(await consumePowerup("freeze"))) return;
    handleFreezePowerup(lobbyId, connection, handleFreezeLocal);
  };

  const handleInkPowerupLocal = async () => {
    if (!(await consumePowerup("black"))) return;

    if (lobbyId && connection) {
      connection
        .invoke("UseInk", lobbyId)
        .catch((err) => setShopError(getShopErrorMessage(err)));
    } else {
      setShowInk(true);
      setInkActive(true);
    }
  };

  const handleMixLocal = () => {
    handleMix(setAllLetters);
  };

  const handleMixPowerupLocal = async () => {
    if (!(await consumePowerup("mix"))) return;
    handleMixLocal();
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
        const playerId = localStorage.getItem("wordmaster-player-id");
        if (!playerId || !lobbyId) return;

        const earnedScore = calculateEarnedScore();
        const scoreResponse = await fetch(
          `/api/lobby/${lobbyId}/shop/${playerId}/sync-score`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ earnedScore }),
          },
        ).catch((err) => {
          console.error("Shop score sync before finish failed:", err);
          return null;
        });

        if (!scoreResponse) return;

        const shopData = await parseShopApiResponse(scoreResponse).catch((err) => {
          setShopError(getShopErrorMessage(err));
          return null;
        });

        if (!shopData) return;
        applyShopState(shopData.state);

        // Send finish to backend
        await fetch(`/api/lobby/${lobbyId}/player-finished/${playerId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoriesCompleted: true, //
            score: shopData.state.balance,
          }),
        }).catch((err) => console.error("API Finish Error:", err));

        // Prevent double sending
        setStopped(true);
      }
    };
    
    notifyFinished();
  }, [allDone, applyShopState, calculateEarnedScore, lobbyId, setStopped, stopped]);

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
          disabled={stopped || getPowerupCount("freeze") <= 0}
          data-testid="btn-freeze"
        >
          Freeze ({getPowerupCount("freeze")})
        </button>

        <button
          className="gp-btn gp-btn--black"
          onClick={handleInkPowerupLocal}
          disabled={stopped || getPowerupCount("black") <= 0}
          data-testid="btn-black"
        >
          Bläck ({getPowerupCount("black")})
        </button>

        <button
          className="gp-btn gp-btn--mix"
          onClick={handleMixPowerupLocal}
          disabled={stopped || getPowerupCount("mix") <= 0}
          data-testid="btn-mix"
        >
          Mix ({getPowerupCount("mix")})
        </button>
      </div>

      {/* Main content */}
      <ShopPanel
        score={score}
        items={shopState.catalog}
        powerups={shopState.powerups}
        loading={shopLoading}
        disabled={stopped || !lobbyId || !getCurrentPlayerId()}
        error={shopError}
        onBuyLetter={purchaseShopItem}
        onBuyPowerup={purchaseShopItem}
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
                {categories[cat.id].valid && lobbyId && (
                  <span
                    style={{
                      color:
                        (categoryPoints[cat.id] ?? 10) === 5
                          ? "#ff8c00"
                          : "#4caf50",
                    }}
                    title={
                      (categoryPoints[cat.id] ?? 10) === 5
                        ? "Samma ord som motståndaren – 5p"
                        : "Unikt ord – 10p"
                    }
                  >
                    {(categoryPoints[cat.id] ?? 10) === 5 ? "5p" : "10p"}
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
