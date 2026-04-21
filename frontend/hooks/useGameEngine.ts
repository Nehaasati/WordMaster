import { useEffect, useRef, useState } from "react";
import { checkWordWithLetters } from "../services/wordValidator";
import type {
  Letter,
  CategoryData,
  ValidateResponse,
} from "../interfaces/Gamepage";

export function useGameEngine(
  lobbyId?: string,
  submitWord?: (category: string, word: string) => void,
  applyJokerFn?: (word: string, categoryId: string) => Promise<number>,
) {
  // -----------------------------
  // INITIAL CATEGORY SETUP
  // -----------------------------
  const createInitialCategories = (): Record<string, CategoryData> => ({
    Name: { id: "Name", label: "Namn", word: "", valid: false, feedback: "" },
    Food: { id: "Food", label: "Mat", word: "", valid: false, feedback: "" },
    Job: { id: "Job", label: "Jobb", word: "", valid: false, feedback: "" },
    Land: { id: "Land", label: "Land", word: "", valid: false, feedback: "" },
    Colour: {
      id: "Colour",
      label: "Färg",
      word: "",
      valid: false,
      feedback: "",
    },
    Animal: {
      id: "Animal",
      label: "Djur",
      word: "",
      valid: false,
      feedback: "",
    },
    Object: {
      id: "Object",
      label: "Sak",
      word: "",
      valid: false,
      feedback: "",
    },
  });

  // -----------------------------
  // STATE
  // -----------------------------
  const [categories, setCategories] = useState(createInitialCategories());
  const [allLetters, setAllLetters] = useState<Letter[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stopped, setStopped] = useState(false);

  // Scoring state (needed by GamePage)
  const [score, setScore] = useState(0);
  const [categoryPoints, setCategoryPoints] = useState<Record<string, number>>(
    {},
  );

  // Refs for scoring + abilities
  const scoreRef = useRef(0);
  const bonusRef = useRef(0);

  // Track words for scoring
  const myWordsRef = useRef<Record<string, string>>({});
  const opponentWordsRef = useRef<Record<string, Set<string>>>({});

  // Track round start time (for abilities)
  const roundStartTime = useRef(0);

  useEffect(() => {
    roundStartTime.current = Date.now();
  }, []);

  // -----------------------------
  // TIMER
  // -----------------------------
  useEffect(() => {
    if (stopped) return;
    const t = setInterval(() => setTimeLeft((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [stopped]);

  // -----------------------------
  // FETCH LETTERS
  // -----------------------------
  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const url = lobbyId ? `/api/lobby/${lobbyId}` : "/api/game/letters";

        const res = await fetch(url);

        if (res.ok) {
          const data = await res.json();
          const letters = lobbyId ? data.letters : data;

          setAllLetters(
            letters.map((char: string) => ({
              id: crypto.randomUUID(),
              char,
              used: false,
              isExtra: false,
            })),
          );

          roundStartTime.current = Date.now();
        }
      } catch {
        console.error("Failed to fetch letters");
      }
    };

    fetchLetters();
  }, [lobbyId]);

  // -----------------------------
  // BUILD AVAILABLE LETTER POOL
  // -----------------------------
  const buildAvailablePool = (categoryId: string): string[] => {
    let otherUsedWord = "";

    for (const catId in categories) {
      if (catId !== categoryId && !categories[catId].valid) {
        otherUsedWord += categories[catId].word;
      }
    }

    const pool = allLetters.map((l) => l.char);

    for (const char of otherUsedWord.toUpperCase()) {
      const index = pool.indexOf(char);
      if (index !== -1) pool.splice(index, 1);
    }

    return pool;
  };

  // -----------------------------
  // CHARACTER ABILITY BONUS
  // -----------------------------
  const calculateAbilityBonus = async (word: string): Promise<number> => {
    try {
      const secondsTaken = (Date.now() - roundStartTime.current) / 1000;
      const characterId = localStorage.getItem("characterId");

      if (!characterId) {
        return 0;
      }

      const res = await fetch("/api/character/ability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          word,
          secondsTaken,
        }),
      });

      if (!res.ok) {
        return 0;
      }

      const data = await res.json();
      return data.bonusPoints ?? 0;
    } catch (err) {
      console.error("Ability bonus error:", err);
      return 0;
    }
  };

  // -----------------------------
  // VALIDATE WORD
  // -----------------------------
  const validateWord = async (word: string, categoryId: string) => {
    if (word.length < 2) return;

    if (!checkWordWithLetters(word, categoryId, categories, allLetters)) {
      return;
    }

    const availablePool = buildAvailablePool(categoryId);

    try {
      const res = await fetch("/api/word/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          Word: word.trim(),
          Category: categoryId,
          Letters: availablePool,
        }),
      });

      const raw = await res.text();
      let data: ValidateResponse;

      try {
        data = JSON.parse(raw);
      } catch {
        console.error("Invalid JSON");
        return;
      }

      if (data.isValid) {
        const bonus = data.bonusPoints ?? (await calculateAbilityBonus(word));
        bonusRef.current += bonus;

        if (applyJokerFn) {
          const multiplier = await applyJokerFn(word, categoryId);
          if (multiplier > 1) {
            console.log(`Joker triggered for "${word}" in ${categoryId}`);
          }
        }

        setCategories((prev) => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            valid: true,
            word,
            feedback: "",
          },
        }));

        submitWord?.(categoryId, word);
      } else {
        setCategories((prev) => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            valid: false,
            word,
            feedback: data.message || "Invalid",
          },
        }));
      }
    } catch (err) {
      console.error("Validation error:", err);
    }
  };

  // -----------------------------
  // RESET FUNCTIONS
  // -----------------------------
  const resetCategories = () => {
    setCategories(createInitialCategories());
  };

  const resetRound = () => {
    scoreRef.current = 0;
    bonusRef.current = 0;
    setScore(0);
    setStopped(false);
    setTimeLeft(0);
    setCategoryPoints({});
    myWordsRef.current = {};
    opponentWordsRef.current = {};
  };

  // -----------------------------
  // RETURN API FOR GAMEPAGE
  // -----------------------------
  return {
    categories,
    setCategories,
    resetCategories,
    resetRound,

    allLetters,
    setAllLetters,

    timeLeft,
    stopped,
    setStopped,

    score,
    setScore,
    scoreRef,
    bonusRef,

    categoryPoints,
    setCategoryPoints,

    myWordsRef,
    opponentWordsRef,

    validateWord,
    buildAvailablePool,
  };
}
