import { useEffect, useRef, useState } from "react";
import type Player from "../src/interfaces/Player";
import type {
  Letter,
  CategoryData,
  ValidateRequest,
  ValidateResponse,
  LobbyResponse,
} from "../interfaces/Gamepage";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function useGameEngine(lobbyId?: string) {
  // -----------------------------
  // STATE
  // -----------------------------
  const [categories, setCategories] = useState<Record<string, CategoryData>>(
    {},
  );
  const [allLetters, setAllLetters] = useState<Letter[]>([]);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [score, setScore] = useState(0);

  const scoreRef = useRef(0);
  const bonusRef = useRef(0);
  const myWordsRef = useRef<Record<string, string>>({});
  const opponentWordsRef = useRef<Record<string, Set<string>>>({});

  const roundStartTime = useRef(0);
  useEffect(() => {
    roundStartTime.current = Date.now();
  }, []);

  // -----------------------------
  // TIMER
  // -----------------------------
  useEffect(() => {
    if (stopped) return;
    const t = setInterval(() => setTimeLeft((prev) => prev + 1), 1000);
    return () => clearInterval(t);
  }, [stopped]);

  // -----------------------------
  // FETCH PLAYER CHARACTER
  // -----------------------------
  useEffect(() => {
    if (!lobbyId) return;

    const fetchPlayerCharacter = async () => {
      try {
        const res = await fetch(`/api/lobby/${lobbyId}`);
        if (res.ok) {
          const data: LobbyResponse = await res.json();
          const storedId = localStorage.getItem("wordmaster-player-id");

          const player =
            data.players?.find((p: Player) => p.id === storedId) ??
            data.players?.[0];

          if (player?.characterId) {
            setCharacterId(player.characterId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch character:", err);
      }
    };

    fetchPlayerCharacter();
  }, [lobbyId]);

  // -----------------------------
  // ORIGINAL LETTER GENERATOR (from GamePage)
  // -----------------------------
  const generateRandomLetters = (
    count: number,
    currentLetters: Letter[] = [],
    isExtra: boolean = false,
  ): Letter[] => {
    const letters: Letter[] = [];

    for (let i = 0; i < count; i++) {
      const pool = [...currentLetters, ...letters].map((l) => l.char);
      const frequencies: Record<string, number> = {};

      for (const char of pool) {
        frequencies[char] = (frequencies[char] || 0) + 1;
      }

      let availableChars = ALPHABET.split("").filter(
        (char) => (frequencies[char] || 0) < 2,
      );

      if (availableChars.length === 0) availableChars = ALPHABET.split("");

      const randomChar =
        availableChars[Math.floor(Math.random() * availableChars.length)];

      letters.push({
        id: crypto.randomUUID(),
        char: randomChar,
        used: false,
        isExtra,
        source: isExtra ? "extra" : "replacement",
      });
    }

    return letters;
  };

  // -----------------------------
  // FETCH INITIAL LETTERS
  // -----------------------------
  useEffect(() => {
    const fetchInitialLetters = async () => {
      try {
        const url = lobbyId ? `/api/lobby/${lobbyId}` : "/api/game/letters";
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          const letters = lobbyId
            ? (data as LobbyResponse).letters
            : (data as string[]);

          setAllLetters(
            letters.map((char) => ({
              id: crypto.randomUUID(),
              char,
              used: false,
              isExtra: false,
              source: "initial",
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

  // -----------------------------
  // ADD EXTRA LETTERS
  // -----------------------------
  const addExtraLetters = async () => {
    try {
      const response = await fetch("/api/game/letters?count=5");
      if (response.ok) {
        const letters: string[] = await response.json();
        const newLetters = letters.map((char) => ({
          id: crypto.randomUUID(),
          char,
          used: false,
          isExtra: true,
          source: "extra",
        }));
        setAllLetters(
          letters.map((char) => ({
            id: crypto.randomUUID(),
            char,
            used: false,
            isExtra: false,
            source: "initial",
          })),
        );
        return;
      }
    } catch {
      // fallback
    }

    setAllLetters((prev) => [...prev, ...generateRandomLetters(5, prev, true)]);
  };

  // -----------------------------
  // CHECK WORD WITH LETTERS
  // -----------------------------
  const checkWordWithLetters = (word: string, categoryId: string) => {
    const wordUpper = word.toUpperCase();

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

    for (const char of wordUpper) {
      const index = pool.indexOf(char);
      if (index === -1) return false;
      pool.splice(index, 1);
    }

    return true;
  };

  // -----------------------------
  // ABILITY BONUS
  // -----------------------------
  const calculateAbilityBonus = async (word: string): Promise<number> => {
    if (!characterId) return 0;

    const secondsTaken = (Date.now() - roundStartTime.current) / 1000;

    try {
      const res = await fetch("/api/character/ability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, word, secondsTaken }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.bonusPoints ?? 0;
      }
    } catch (err) {
      console.error("Error calculating ability bonus:", err);
    }

    return 0;
  };

  // -----------------------------
  // WORD VALIDATION
  // -----------------------------
  const validateWord = async (word: string, categoryId: string) => {
    const category = categories[categoryId];
    if (!category) return;

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
      const storedId = localStorage.getItem("wordmaster-player-id") ?? "";

      const availablePool = allLetters.map((l) => l.char);

      const request: ValidateRequest = {
        word: word.trim(),
        categoryId,
        letters: availablePool,
        lobbyId: lobbyId!,
        playerId: storedId,
      };

      const response = await fetch("/api/word/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(request),
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

      const data: ValidateResponse = await response.json();

      if (data.isValid) {
        const bonus = data.bonusPoints ?? (await calculateAbilityBonus(word));
        bonusRef.current += bonus;

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
    } catch (err) {
      console.error("Validation error:", err);

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

  // -----------------------------
  // RESET GAME STATE
  // -----------------------------
  const resetGameState = () => {
    setStopped(false);
    setTimeLeft(0);
    setCategories({});
    setAllLetters([]);
    setScore(0);
    scoreRef.current = 0;
    bonusRef.current = 0;
    myWordsRef.current = {};
    opponentWordsRef.current = {};
  };

  return {
    categories,
    allLetters,
    timeLeft,
    score,
    stopped,
    validateWord,
    addExtraLetters,
    resetGameState,
    setCategories,
    setAllLetters,
    setStopped,
    setScore,
    scoreRef,
    myWordsRef,
    opponentWordsRef,
    calculateAbilityBonus,
  };
}