import { useEffect, useRef, useState } from "react";
import type {
  Letter,
  CategoryData,
  ValidateResponse,
} from "../interfaces/Gamepage";

const weightedLetters: string[] = [
  ...Array(5).fill("A"),
  ...Array(5).fill("E"),
  ...Array(5).fill("I"),
  ...Array(5).fill("O"),
  ...Array(5).fill("U"),
  ...Array(5).fill("Y"),
  ...Array(2).fill("Å"),
  ...Array(2).fill("Ä"),
  ...Array(2).fill("Ö"),
  ...Array(3).fill("B"),
  "C",
  ...Array(3).fill("D"),
  ...Array(2).fill("F"),
  ...Array(3).fill("G"),
  ...Array(3).fill("H"),
  ...Array(2).fill("J"),
  ...Array(4).fill("K"),
  ...Array(4).fill("L"),
  ...Array(4).fill("M"),
  ...Array(4).fill("N"),
  ...Array(3).fill("P"),
  ...Array(5).fill("R"),
  ...Array(5).fill("S"),
  ...Array(5).fill("T"),
  ...Array(3).fill("V"),
  "W",
  "X",
  "Z",
];

const getRandomReplacementLetter = (excludedLetters: Set<string>) => {
  const candidates = weightedLetters.filter(
    (letter) => !excludedLetters.has(letter),
  );
  const pool = candidates.length > 0 ? candidates : weightedLetters;

  return pool[Math.floor(Math.random() * pool.length)];
};

export function useGameEngine(
  lobbyId?: string,
  submitWord?: (category: string, word: string) => void,
  applyJokerFn?: (word: string, categoryId: string) => Promise<number>,
) {
  // -----------------------------
  // INITIAL CATEGORY SETUP
  // -----------------------------
  const createInitialCategories = (): Record<string, CategoryData> => ({
    Name: {
      id: "Name",
      label: "Namn",
      word: "",
      letterIds: [],
      valid: false,
      feedback: "",
    },
    Food: {
      id: "Food",
      label: "Mat",
      word: "",
      letterIds: [],
      valid: false,
      feedback: "",
    },
    Job: {
      id: "Job",
      label: "Jobb",
      word: "",
      letterIds: [],
      valid: false,
      feedback: "",
    },
    Land: {
      id: "Land",
      label: "Land",
      word: "",
      letterIds: [],
      valid: false,
      feedback: "",
    },
    Colour: {
      id: "Colour",
      label: "Färg",
      word: "",
      letterIds: [],
      valid: false,
      feedback: "",
    },
    Animal: {
      id: "Animal",
      label: "Djur",
      word: "",
      letterIds: [],
      valid: false,
      feedback: "",
    },
    Object: {
      id: "Object",
      label: "Sak",
      word: "",
      letterIds: [],
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
  const validationSeqRef = useRef<Record<string, number>>({});

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
  const getReservedLetterIds = (
    categoryId: string,
    sourceCategories: Record<string, CategoryData> = categories,
  ) => {
    const reservedIds = new Set<string>();

    for (const catId in sourceCategories) {
      if (catId !== categoryId && !sourceCategories[catId].valid) {
        for (const id of sourceCategories[catId].letterIds) {
          reservedIds.add(id);
        }
      }
    }

    return reservedIds;
  };

  const getLettersById = (letterIds: string[]) => {
    const letterById = new Map(allLetters.map((letter) => [letter.id, letter]));
    return letterIds
      .map((id) => letterById.get(id)?.char)
      .filter((char): char is string => Boolean(char));
  };

  const buildAvailablePool = (categoryId: string): string[] => {
    const reservedIds = getReservedLetterIds(categoryId);

    return allLetters
      .filter((letter) => !reservedIds.has(letter.id))
      .map((letter) => letter.char);
  };

  const buildLetterSelection = (word: string, categoryId: string) => {
    const reservedIds = getReservedLetterIds(categoryId);
    const selectedIds = new Set(reservedIds);
    const letterIds: string[] = [];
    let filtered = "";

    for (const char of word.toUpperCase()) {
      const letter = allLetters.find(
        (candidate) =>
          !selectedIds.has(candidate.id) && candidate.char === char,
      );

      if (!letter) {
        continue;
      }

      filtered += char;
      letterIds.push(letter.id);
      selectedIds.add(letter.id);
    }

    return { word: filtered, letterIds };
  };

  const replaceSelectedLetters = (
    selectedLetterIds: string[],
    serverReplacementLetters: string[],
  ) => {
    setAllLetters((prev) => {
      const selectedIds = new Set(selectedLetterIds);
      const next = prev.map((letter) => ({ ...letter }));
      const consumedLetters = next.filter((letter) => selectedIds.has(letter.id));
      const consumedChars = new Set(
        consumedLetters.map((letter) => letter.char.toUpperCase()),
      );

      let replacementIndex = 0;
      for (const tileIndex of next.keys()) {
        const currentTile = next[tileIndex];
        if (!selectedIds.has(currentTile.id) || currentTile.source === "shop") {
          continue;
        }

        const serverReplacement =
          serverReplacementLetters[replacementIndex]?.toUpperCase();
        const replacementChar =
          serverReplacement && !consumedChars.has(serverReplacement)
            ? serverReplacement
            : getRandomReplacementLetter(consumedChars);

        next[tileIndex] = {
          id: crypto.randomUUID(),
          char: replacementChar,
          used: false,
          isExtra: false,
          source: "replacement",
        };
        replacementIndex += 1;
      }

      return next;
    });
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
  const validateWord = async (
    word: string,
    categoryId: string,
    selectedLetterIds: string[],
  ) => {
    const validationSeq = (validationSeqRef.current[categoryId] ?? 0) + 1;
    validationSeqRef.current[categoryId] = validationSeq;

    if (word.length < 2) return;

    const selectedLetters = getLettersById(selectedLetterIds);
    if (selectedLetters.length !== word.length) {
      return;
    }

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
          Letters: selectedLetters,
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

      if (validationSeqRef.current[categoryId] !== validationSeq) {
        return;
      }

      if (data.isValid) {
        replaceSelectedLetters(selectedLetterIds, data.replacementLetters ?? []);

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
            letterIds: [],
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
            letterIds: selectedLetterIds,
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
    validationSeqRef.current = {};
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
    buildLetterSelection,
    buildAvailablePool,
  };
}
