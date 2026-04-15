import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from "react-router-dom";
import type { Letter,CategoryData, StarData, Category,ValidateResponse } from '../interfaces/GamePage'
import * as signalR from '@microsoft/signalr'
import '../css/GamePage.css'
import ShopPanel from './ShopPanel'
///Star annimation
const STATIC_STARS: StarData[] = Array.from({ length: 60 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  d: (2 + Math.random() * 4).toFixed(1) + 's',
  del: (Math.random() * 5).toFixed(1) + 's',
  min: (0.2 + Math.random() * 0.3).toFixed(2),
}));

const Stars: React.FC = () => {
  return (
    <div className="gp-stars">
      {STATIC_STARS.map(s => (
        <div key={s.id} className="gp-star" style={{
            left: s.left + '%',
            top: s.top + '%',
            width: s.size + 'px',
            height: s.size + 'px',
            ['--d' as string]: s.d,
            ['--del' as string]: s.del,
            ['--min' as string]: s.min,
          } as React.CSSProperties} />
      ))}
    </div>
  );
};
const CATEGORY_LIST: Category[] = [
  { id: 'Name',   label: 'Namn'      },
  { id: 'Food',   label: 'Mat'       },
  { id: 'Job',    label: 'Jobb'      },
  { id: 'Land',   label: 'Land'      },
  { id: 'Colour', label: 'Färg'      },
  { id: 'Animal', label: 'Djur'      },
  { id: 'Object', label: 'Sak'       },
]
const GamePage: React.FC = () => {

  const { lobbyId } = useParams<{ lobbyId: string; }>();
  const navigate = useNavigate();
  const [allLetters, setAllLetters] = useState<Letter[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryData>>(
    () => {
      const initial: Record<string, CategoryData> = {};
      CATEGORY_LIST.forEach((cat) => {
        initial[cat.id] = { word: "", valid: false, feedback: "" };
      });
      return initial;
    },
  );
  const [backendConnected, setBackendConnected] = useState<boolean | null>(
    null,
  );
  const [timeLeft, setTimeLeft] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [freezeMsg, setFreezeMsg] = useState("");
  const [stopped, setStopped] = useState(false);
  const [score, setScore] = useState(0);
  const [characterId, setCharacterId] = useState<string>("");
  const [roundStartTime] = useState<number>(Date.now());
  const [showInk, setShowInk] = useState(false);
  const [gameStopped, setGameStopped] = useState(false);
  const [inkActive, setInkActive] = useState(false);
  const [showFreeze, setShowFreeze] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const bonusRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const myWordsRef = useRef<Record<string, string>>({});
  const opponentWordsRef = useRef<Record<string, Set<string>>>({});
  const [categoryPoints, setCategoryPoints] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string>("");
  const [isHost, setIsHost] = useState(
    localStorage.getItem("isHost") === "true",
  );

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";

  // SignalR
  
useEffect(() => {
  if (!lobbyId) return;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://127.0.0.1:5024/lobbyHub")
    .withAutomaticReconnect()
    .build();

  let alreadyNavigating = false;

  connection.start().then(async () => {
    await connection.invoke("JoinLobbyGroup", lobbyId);

    // NEW ROUND
    connection.on("LobbyReset", async () => {
      console.log("Lobby reset → new round");

      setStopped(false);
      setTimeLeft(0);

      // reset categories
      const initial: Record<string, CategoryData> = {};
      CATEGORY_LIST.forEach((cat) => {
        initial[cat.id] = { word: "", valid: false, feedback: "" };
      });
      setCategories(initial);

      // fetch new letters
      const res = await fetch(`http://127.0.0.1:5024/api/lobby/${lobbyId}`);
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
    });

    // PLAYER LEFT
    connection.on("PlayerLeft", (playerId: string) => {
      console.log("Player left:", playerId);

      const myId = localStorage.getItem("wordmaster-player-id");

      if (playerId !== myId) {
        setToast("En spelare lämnade lobbyn");
        setTimeout(() => setToast(""), 3000);
      }
    });
    connection.on("GameStopped", (lId: string, _stoppedByPlayerId: string, _stoppedScore: number) => {
      if (alreadyNavigating) return;
      alreadyNavigating = true;
      setGameStopped(true);
      setStopped(true);

      const myId = localStorage.getItem("wordmaster-player-id") ?? "";
      fetch(`http://127.0.0.1:5024/api/lobby/${lId}/save-score/${myId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreRef.current }),
      })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            navigate(`/result/${lId}`, { state: { gameStopped: true } });
          }, 2500);
        });
    });
    // HOST CHANGED
    connection.on("HostChanged", (newHostId: string) => {
      const myId = localStorage.getItem("wordmaster-player-id");

      if (myId === newHostId) {
        localStorage.setItem("isHost", "true");
        setIsHost(true);
      } else {
        setIsHost(false);
      }
    });

    // MATCH ENDED
    connection.on("MatchEnded", (lId: string) => {
      if (alreadyNavigating) return;
      alreadyNavigating = true;
      setStopped(true);

      const myId = localStorage.getItem("wordmaster-player-id") ?? "";
      fetch(`http://127.0.0.1:5024/api/lobby/${lId}/save-score/${myId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreRef.current }),
      })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            navigate(`/result/${lId}`, { state: { gameStopped: false } });
          }, 3000);
        });
    });
  connection.on("WordSubmitted", (senderId, category, word) => {
      const myPlayerId = localStorage.getItem("wordmaster-player-id") ?? "";
      const isMine = senderId === myPlayerId;
      if (isMine) {
          myWordsRef.current[category] = word;
      } else {
          if (!opponentWordsRef.current[category]) opponentWordsRef.current[category] = new Set();
          opponentWordsRef.current[category].add(word);
      }
      setCategoryPoints((prev) => {
          const updated = { ...prev };
          for (const cat of Object.keys(myWordsRef.current)) {
              const myWord = myWordsRef.current[cat];
              const opponentSet = opponentWordsRef.current[cat] ?? new Set();
              updated[cat] = opponentSet.has(myWord) ? 5 : 10;
          }
          return updated;
      });
  });
});
  connectionRef.current = connection;
  return () => {
    connection.stop();
  };
}, [lobbyId]);

  useEffect(() => {
    if (stopped) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [stopped]);
  // Weighted randomizer to reduce duplicates
  const generateRandomLetters = (
    count: number,
    currentLetters: Letter[] = [],
    isExtra: boolean = false,
  ) => {
    const letters: Letter[] = [];

    for (let i = 0; i < count; i++) {
      // Calculate current letter frequencies in existing pool + what we just generated
      const pool = [...currentLetters, ...letters].map((l) => l.char);
      const frequencies: Record<string, number> = {};
      for (const char of pool) {
        frequencies[char] = (frequencies[char] || 0) + 1;
      }

      // Filter alphabet to avoid too many duplicates (max 2 of same)
      let availableChars = ALPHABET.split("").filter(
        (char) => (frequencies[char] || 0) < 2,
      );

      // If we filtered everything (unlikely), reset to full alphabet
      if (availableChars.length === 0) availableChars = ALPHABET.split("");

      const randomChar =
        availableChars[Math.floor(Math.random() * availableChars.length)];

      letters.push({
        id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        char: randomChar,
        used: false,
        isExtra,
      });
    }
    return letters;
  };
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5024/api/health");
        setBackendConnected(response.ok);
      } catch {
        setBackendConnected(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const fetchPlayerCharacter = async () => {
      if (!lobbyId) return;
      try {
        const res = await fetch(`http://127.0.0.1:5024/api/lobby/${lobbyId}`);
        if (res.ok) {
          const data = await res.json();
          const storedPlayerId = localStorage.getItem("wordmaster-player-id");
          const player =
            data.players?.find((p: any) => p.id === storedPlayerId) ??
            data.players?.[0];
          if (player?.characterId) {
            setCharacterId(player.characterId);
            console.log("Character loaded:", player.characterId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch character:", err);
      }
    };
    fetchPlayerCharacter();
  }, [lobbyId]);

  useEffect(() => {
    const fetchInitialLetters = async () => {
      try {
        const url = lobbyId
          ? `http://127.0.0.1:5024/api/lobby/${lobbyId}`
          : "http://127.0.0.1:5024/api/game/letters";

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const letters: string[] = lobbyId ? data.letters : data;
          setAllLetters(
            letters.map((char) => ({
              id:
                Math.random().toString(36).substr(2, 9) +
                Date.now().toString(36),
              char,
              used: false,
              isExtra: false,
            })),
          );
        } else {
          setAllLetters(generateRandomLetters(15));
        }
      } catch {
        setAllLetters(generateRandomLetters(15));
      }
    };
    fetchInitialLetters();
  }, [lobbyId]);

  const addExtraLetters = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5024/api/game/letters?count=5",
      );
      if (response.ok) {
        const letters: string[] = await response.json();
        const newLetters = letters.map((char) => ({
          id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          char,
          used: false,
          isExtra: true,
        }));
        setAllLetters((prev) => [...prev, ...newLetters]);
      }
    } catch {
      setAllLetters((prev) => [
        ...prev,
        ...generateRandomLetters(5, prev, true),
      ]);
    }
  };
  const calculateAbilityBonus = async (word: string): Promise<number> => {
    if (!characterId) return 0;
    const secondsTaken = (Date.now() - roundStartTime) / 1000;
    try {
      const res = await fetch("http://127.0.0.1:5024/api/character/ability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, word, secondsTaken }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(
          `Ability: ${characterId} | Word: ${word} | Seconds: ${secondsTaken.toFixed(1)} | Bonus: ${data.bonusPoints}`,
        );
        return data.bonusPoints;
      }
    } catch (err) {
      console.error("Ability check failed:", err);
    }
    return 0;
  };
  const updateUsedLetters = () => {
    let combinedWord = "";
    for (const catId in categories) {
      if (!categories[catId].valid) {
        combinedWord += categories[catId].word;
      }
    }
    combinedWord = combinedWord.toUpperCase();

    setAllLetters((prev) => {
      const nextLetters = prev.map((l) => ({ ...l, used: false }));
      for (const char of combinedWord) {
        const letter = nextLetters.find((l) => !l.used && l.char === char);
        if (letter) {
          letter.used = true;
        }
      }
      return nextLetters;
    });
  };
  const checkWordWithLetters = (word: string, categoryId: string) => {
    const wordUpper = word.toUpperCase();

    // Get pool of available letters (all minus those used by OTHER non-valid categories)
    let otherUsedWord = "";
    for (const catId in categories) {
      if (catId !== categoryId && !categories[catId].valid) {
        otherUsedWord += categories[catId].word;
      }
    }
    otherUsedWord = otherUsedWord.toUpperCase();

    const pool = allLetters.map((l) => l.char);
    // Remove other used letters from pool first
    for (const char of otherUsedWord) {
      const index = pool.indexOf(char);
      if (index !== -1) pool.splice(index, 1);
    }

    // Now check if current word can be formed
    for (const char of wordUpper) {
      const index = pool.indexOf(char);
      if (index === -1) return false;
      pool.splice(index, 1);
    }
    return true;
  };

  const validateWord = async (word: string, categoryId: string) => {
    if (word.length === 0) {
      setCategories((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], feedback: "", valid: false, word },
      }));
      return;
    }

    if (word.length < 2) {
      setCategories((prev) => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          feedback: "Too short",
          valid: false,
          word,
        },
      }));
      return;
    }

    if (!checkWordWithLetters(word, categoryId)) {
      setCategories((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], valid: false, word },
      }));
      return;
    }

    try {
      // Determine letters available for THIS validation
      let otherUsedWord = "";
      for (const catId in categories) {
        if (catId !== categoryId && !categories[catId].valid) {
          otherUsedWord += categories[catId].word;
        }
      }
      otherUsedWord = otherUsedWord.toUpperCase();

      const availablePool = allLetters.map((l) => l.char);
      for (const char of otherUsedWord) {
        const index = availablePool.indexOf(char);
        if (index !== -1) availablePool.splice(index, 1);
      }

      const url = "http://127.0.0.1:5024/api/word/validate";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          word: word.trim(),
          category: categoryId,
          letters: availablePool,
        }),
      });

      if (!response.ok) {
        setCategories((prev) => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            feedback: "Error fetching",
            valid: false,
            word,
          },
        }));
        return;
      }

      const data = await response.json();
      if (data.isValid) {

        // ── Character ability bonus ──────────────────
        const bonus = await calculateAbilityBonus(word);
        if (bonus > 0) {
          bonusRef.current += bonus;    // ← store bonus in ref
          console.log(`+${bonus} bonus from ${characterId}! Total bonus: ${bonusRef.current}`);

        }
        // ────────────────────────────────────────────
        // Fetch replacement letters from backend
        let newLetterChars: string[] = [];
        try {
          const resp = await fetch(
            `http://127.0.0.1:5024/api/game/letters?count=${word.length}`,
          );
          if (resp.ok) newLetterChars = await resp.json();
        } catch {
          /* fallback to local generation below */
        }

        // Re-implementing letter replacement more robustly
        setAllLetters((prev) => {
          const nextLetters = [...prev];
          const wordUpper = word.toUpperCase();
          const charsToReplace = wordUpper.split("");

          for (let i = 0; i < nextLetters.length; i++) {
            const l = nextLetters[i];
            if (l.used) {
              const charIdx = charsToReplace.indexOf(l.char);
              if (charIdx !== -1) {
                // Replace this letter
                const newChar =
                  newLetterChars[0] ||
                  generateRandomLetters(
                    1,
                    nextLetters.filter((_, idx) => idx !== i),
                  )[0].char;
                if (newLetterChars.length > 0) newLetterChars.shift();

                nextLetters[i] = {
                  ...l,
                  char: newChar,
                  used: false,
                  id:
                    Math.random().toString(36).substr(2, 9) +
                    Date.now().toString(36),
                };
                charsToReplace.splice(charIdx, 1);
              }
            }
          }
          return nextLetters;
        });

        setCategories((prev) => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            feedback: "",
            valid: true,
            word,
          },
        }));
        if (lobbyId && connectionRef.current) {
          const myPlayerId = localStorage.getItem("wordmaster-player-id") ?? "";
          const normalizedWord = word.trim().toUpperCase();
          myWordsRef.current[categoryId] = normalizedWord;
          const opponentSet = opponentWordsRef.current[categoryId] ?? new Set();
          setCategoryPoints((prev) => ({ ...prev, [categoryId]: opponentSet.has(normalizedWord) ? 5 : 10 }));
          connectionRef.current.invoke("SubmitWord", lobbyId, myPlayerId, categoryId, normalizedWord)
              .catch((err) => console.error("SignalR SubmitWord error:", err));
        }
      } else {
        setCategories((prev) => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            feedback: data.message || "Word not found",
            valid: false,
            word,
          },
        }));
      }
    } catch (error: any) {
      setCategories((prev) => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          feedback: "Error fetching",
          valid: false,
          word,
        },
      }));
    }
  };

  // Automatic focus shift
  useEffect(
    () => {
      const nextCat = CATEGORY_LIST.find((cat) => !categories[cat.id].valid);
      if (nextCat) {
        inputRefs.current[nextCat.id]?.focus();
      }
    },
    CATEGORY_LIST.map((cat) => categories[cat.id].valid),
  );

  useEffect(() => {
    updateUsedLetters();
  }, [categories]);

  useEffect(() => {
    let total = 0;
    for (const cat of CATEGORY_LIST) {
        const catData = categories[cat.id];
        if (!catData.valid) continue;
        const points = categoryPoints[cat.id] ?? 10;
        total += points;
        if (catData.word.length > 7) total += 5;
    }
    const newScore = total + bonusRef.current;
        setScore(newScore);
        scoreRef.current = newScore;
        }, [categories, categoryPoints]);

  const handleInputChange = (
    categoryId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (frozen || stopped) return;
    const val = e.target.value.toUpperCase();

    // If it was valid, typing in it again (if allowed) should reset valid
    // But it's disabled when valid, so this only happens if we programmatically reset it.
    if (categories[categoryId].valid) {
      setCategories((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], valid: false },
      }));
    }

    if (val.length > categories[categoryId].word.length) {
      const addedChar = val[val.length - 1];

      // Check if we have this letter available (not used by other NON-VALID categories).
      let otherUsedWord = "";
      for (const catId in categories) {
        if (catId !== categoryId && !categories[catId].valid) {
          otherUsedWord += categories[catId].word;
        }
      }
      otherUsedWord = otherUsedWord.toUpperCase();

      const pool = allLetters.map((l) => l.char);
      for (const char of otherUsedWord) {
        const index = pool.indexOf(char);
        if (index !== -1) pool.splice(index, 1);
      }

      const charCountInWord = val
        .split("")
        .filter((c) => c === addedChar).length;
      const charCountInPool = pool.filter((c) => c === addedChar).length;

      if (charCountInPool < charCountInWord) return;
    }

    validateWord(val, categoryId);
  };
  const handleFreeze = () => {
    setFrozen(true);
    setShowFreeze(true);
    setFreezeMsg("Freeze: Du kan inte skriva i 5 sekunder");

    // Fade in
    setTimeout(() => {
      setFreezeActive(true);
    }, 50);

    // Start fade out at 4.6s
    setTimeout(() => {
      setFreezeActive(false);
    }, 4600);

    // Remove from DOM at 5s
    setTimeout(() => {
      setFrozen(false);
      setFreezeMsg("");
      setShowFreeze(false);
    }, 5000);
  };

  const handleFreezePowerup = () => {
    if (lobbyId && connectionRef.current) {
      connectionRef.current.invoke("UseFreeze", lobbyId);
    } else {
      handleFreeze();
    }
  };

  const handleMix = () => {
    setAllLetters((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };
  const handleStopGame = async () => {
    if (!lobbyId || !connectionRef.current) return;
    const myPlayerId = localStorage.getItem("wordmaster-player-id") ?? "";
    try {
      await fetch(`http://127.0.0.1:5024/api/lobby/${lobbyId}/save-score/${myPlayerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: Math.round(score) }),
      });
    } catch {
      console.error("Failed to save score before stopping");
    }
    connectionRef.current
      .invoke("StopGame", lobbyId, myPlayerId, Math.round(score))
      .catch((err) => console.error("SignalR StopGame error:", err));
  };

  // The classic game
  const handleFinishClassic = () => {
    setStopped(true);
  };

  const allDone = CATEGORY_LIST.every((c) => categories[c.id].valid);

  //Send all done to backend
  useEffect(() => {
    const notifyFinished = async () => {
      if (allDone && !stopped) {
        if (lobbyId && connectionRef.current) {
          connectionRef.current
            .invoke("FinishGame", lobbyId)
            .catch((err) => console.error("SignalR Finish Error:", err));
          const playerId = localStorage.getItem("wordmaster-player-id");
          if (playerId) {
            fetch(
              `http://127.0.0.1:5024/api/lobby/${lobbyId}/player-finished/${playerId}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  categoriesCompleted: true,
                  score: score,
                }),
              },
            ).catch((err) => console.error("API Finish Error:", err));
          }
        } else if (!lobbyId) {
          setStopped(true);
        }
      }
    };

    notifyFinished();
  }, [allDone, lobbyId, stopped]);

  // Handle restart
  const handleRestart = async () => {
    const playerId = localStorage.getItem("wordmaster-player-id");

    if (!lobbyId || !playerId) return;

    await fetch(`http://127.0.0.1:5024/api/lobby/${lobbyId}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
  };

  // To leave the lobby
  const handleLeave = async () => {
    const playerId = localStorage.getItem("wordmaster-player-id");

    if (!lobbyId || !playerId) return;

    await fetch(
      `http://127.0.0.1:5024/api/lobby/${lobbyId}/leave/${playerId}`,
      { method: "POST" },
    );

    navigate("/");
  };

  return (
    <div className="gp-scene" data-testid="game-page">
      <div className="gp-bg" />
      <Stars />
      {toast && <div className="gp-toast">{toast}</div>}

      {/* Top bar */}
      <div className="gp-top-bar">
        {isHost && <div className="gp-host">Värden</div>}

        {/* Leave the lobby */}
        <button className='gp-leave'
          onClick={handleLeave}
        >
          Leave
        </button>
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
          onClick={handleFreezePowerup}
          data-testid="btn-freeze"
        >
          Freeze
        </button>

        <button
          className="gp-btn gp-btn--black"
          onClick={() => connectionRef.current?.invoke("UseInk", lobbyId)}
          data-testid="btn-black"
        >
          Bläck
        </button>

        <button
          className="gp-btn gp-btn--mix"
          onClick={handleMix}
          data-testid="btn-mix"
        >
          Mix
        </button>
        {lobbyId && !stopped && (
          <button
            className="gp-btn gp-btn--stop"
            onClick={handleStopGame}
            data-testid="btn-stop"
          >
            Stopp
          </button>
        )}
      </div>

      {/* Main content */}
      <ShopPanel
  score={score}
  onBuyLetter={(letter, cost) => {
    setScore(prev => prev - cost)
    setAllLetters(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        char: letter,
        used: false,
        isExtra: true
      }
    ])
  }}
  onBuyPowerup={(powerupId, cost) => {
    setScore(prev => prev - cost)
    if (powerupId === 'freeze') handleFreeze()
    if (powerupId === 'mix') handleMix()
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
                  ref={(el) => (inputRefs.current[cat.id] = el)}
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
                      style={{ color: (categoryPoints[cat.id] ?? 10) === 5 ? "#ff8c00" : "#4caf50" }}
                      title={(categoryPoints[cat.id] ?? 10) === 5 ? "Samma ord som motståndaren – 5p" : "Unikt ord – 10p"}
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
                En spelare tryckte på Stopp. Vidarebefordrar till resultatsidan...
              </p>
            )}
            <p>Din tid: {timeLeft} sekunder</p>
            <p>Din poäng: {score}</p>

            {/* 🆕 Restart button (ONLY HOST) */}
            {lobbyId && localStorage.getItem("isHost") === "true" && (
              <button
                className="gp-btn"
                onClick={handleRestart}
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
              >
                Tillbaka till menyn
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
 
export default GamePage