import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import type {
  Letter,
  CategoryData,
  StarData,
  Category,
  ValidateResponse,
} from "../interfaces/GamePage";
import "../css/GamePage.css";
///Star annimation
const Stars: React.FC = () => {
  const stars = useRef<StarData[]>([]);
  if (!stars.current.length) {
    for (let i = 0; i < 60; i++) {
      const size = Math.random() * 2 + 0.5;
      stars.current.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size,
        d: (2 + Math.random() * 4).toFixed(1) + "s",
        del: (Math.random() * 5).toFixed(1) + "s",
        min: (0.2 + Math.random() * 0.3).toFixed(2),
      });
    }
  }
  return (
    <div className="gp-stars">
      {stars.current.map((s) => (
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
  { id: "Food", label: "Mat/Frukt" },
  { id: "Job", label: "Jobb" },
  { id: "Land", label: "Stad/Land" },
  { id: "Colour", label: "Färg" },
  { id: "Animal", label: "Djur" },
  { id: "Object", label: "Sak" },
];
const GamePage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
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
  const [timeLeft, setTimeLeft] = useState(60);
  const [frozen, setFrozen] = useState(false);
  const [freezeMsg, setFreezeMsg] = useState("");
  const [stopped, setStopped] = useState(false);
  const [score, setScore] = useState(0);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";
  useEffect(() => {
    if (stopped) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
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
    const calculateScore = async () => {
      const categorySubmissions = CATEGORY_LIST.map((cat) => ({
        id: cat.id,
        word: categories[cat.id].word,
        isValid: categories[cat.id].valid,
      }));
      try {
        const response = await fetch(
          "http://127.0.0.1:5024/api/game/calculate-score",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categories: categorySubmissions }),
          },
        );
        if (response.ok) {
          const data = await response.json();
          setScore(data.score);
        }
      } catch (error) {
        console.error("Failed to calculate score:", error);
      }
    };
    calculateScore();
  }, [categories]);

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
    setFreezeMsg("Freeze: Du kan inte skriva i 5 sekunder");
    setTimeout(() => {
      setFrozen(false);
      setFreezeMsg("");
    }, 5000);
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

  const allDone = CATEGORY_LIST.every((c) => categories[c.id].valid);
  return (
    <div className="gp-scene" data-testid="game-page">
      <div className="gp-bg" />
      <Stars />

      <div className="gp-top-bar">
        <div className="gp-freeze-msg" data-testid="freeze-msg">
          {freezeMsg}
        </div>
        <div className="gp-score" data-testid="score">
          POÄNG: {score}
        </div>
        <div className="gp-timer" data-testid="timer">
          TID: {timeLeft} sekunder
        </div>
      </div>
      <div className="gp-powerups">
        <button
          className="gp-btn gp-btn--freeze"
          onClick={handleFreeze}
          data-testid="btn-freeze"
        >
          Freeze
        </button>
        <button
          className="gp-btn gp-btn--black"
          onClick={addExtraLetters}
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
      </div>
      <div className="gp-content">
        <div className="gp-categories" data-testid="categories">
          {CATEGORY_LIST.map((cat) => (
            <div className="gp-cat-row" key={cat.id}>
              <label className="gp-cat-label">{cat.label}:</label>
              <div className="gp-cat-input-wrap">
                <input
                  type="text"
                  ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[cat.id] = el;
                  }}
                  className={`gp-cat-input ${categories[cat.id].valid ? "gp-cat-input--valid" : ""}`}
                  value={categories[cat.id].word}
                  onChange={(e) => handleInputChange(cat.id, e)}
                  disabled={categories[cat.id].valid || frozen || stopped}
                  data-testid={`input-${cat.id}`}
                />
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
        <div className="gp-right">
          <div className="gp-letters" data-testid="letters">
            {allLetters.map((letter) => (
              <div
                key={letter.id}
                className={`gp-letter ${letter.isExtra ? "gp-letter--extra" : ""} ${letter.used ? "gp-letter--used" : ""}`}
                data-testid="letter-tile"
              >
                {letter.char}
              </div>
            ))}
          </div>
          <button
            className={`gp-stop-btn ${allDone ? "gp-stop-btn--ready" : ""}`}
            onClick={() => setStopped(true)}
            disabled={stopped}
            data-testid="btn-stop"
          >
            Stopp
          </button>
        </div>
      </div>
      {stopped && (
        <div className="gp-stopped-overlay" data-testid="stopped-overlay">
          <div className="gp-stopped-card">
            <h2>Stopp!</h2>
            <p>Din tid: {60 - timeLeft} sekunder</p>
            <p>Din poäng: {score}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;