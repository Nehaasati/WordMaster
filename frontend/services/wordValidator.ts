// wordValidator.ts - Word validation utilities

import type { Letter, CategoryData } from "../interfaces/Gamepage";

export const checkWordWithLetters = (
  word: string,
  categoryId: string,
  categories: Record<string, CategoryData>,
  allLetters: Letter[],
): boolean => {
  const wordUpper = word.toUpperCase();

  const pool = allLetters.map((l) => l.char);

  for (const catId in categories) {
    if (catId !== categoryId && categories[catId].valid) {
      const otherWord = categories[catId].word.toUpperCase();

      for (const char of otherWord) {
        const index = pool.indexOf(char);
        if (index !== -1) pool.splice(index, 1);
      }
    }
  }

  for (const char of wordUpper) {
    const index = pool.indexOf(char);
    if (index === -1) return false;
    pool.splice(index, 1);
  }

  return true;
};

export const updateUsedLetters = (
  categories: Record<string, CategoryData>,
  setAllLetters: (setter: (prev: Letter[]) => Letter[]) => void,
) => {
  let combinedWord = "";

  for (const catId in categories) {
    if (categories[catId].valid) {
      // add valid words from other categories to the pool
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
