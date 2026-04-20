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

        // Update category
        setCategories((prev) => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            valid: true,
            word,
            feedback: "",
          },
        }));

        // Submit to SignalR
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
    setScore(0);
    setStopped(false);
    setTimeLeft(0);
    setCategoryPoints({});
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

    categoryPoints,
    setCategoryPoints,

    validateWord,
    buildAvailablePool,
  };
}