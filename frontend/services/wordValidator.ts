// wordValidator.ts

import type { Letter, CategoryData } from "../interfaces/Gamepage";

/**
 * validates that the word can be formed with the available letters (taking into account other used words in categories)
 */
export const checkWordWithLetters = (
  word: string,
  categoryId: string,
  categories: Record<string, CategoryData>,
  allLetters: Letter[],
): boolean => {
  const wordUpper = word.toUpperCase();

  // combine all other used words in categories (except the current one) to know which letters are already taken
  let otherUsedWord = "";

  for (const catId in categories) {
    if (catId !== categoryId && !categories[catId].valid) {
      otherUsedWord += categories[catId].word;
    }
  }

  otherUsedWord = otherUsedWord.toUpperCase();

  // create a pool of available letters (initially all letters)
  const pool = allLetters.map((l) => l.char);

  // remove letters that are already taken by other used words in categories
  for (const char of otherUsedWord) {
    const index = pool.indexOf(char);
    if (index !== -1) pool.splice(index, 1);
  }

  // check if the word can be formed with the remaining available letters
  for (const char of wordUpper) {
    const index = pool.indexOf(char);
    if (index === -1) return false;
    pool.splice(index, 1);
  }

  return true;
};

/**
 * update used letters based on the words used in categories (called after validating a word and updating categories state)
 */
export const updateUsedLetters = (
  categories: Record<string, CategoryData>,
  setAllLetters: (setter: (prev: Letter[]) => Letter[]) => void,
) => {
  let combinedWord = "";

  // validateWord is called after updating categories state with the new word, so we can be sure that categories state is up to date when this function is called, and we can combine all used words in categories to know which letters should be marked as used
  for (const catId in categories) {
    if (!categories[catId].valid) {
      combinedWord += categories[catId].word;
    }
  }

  combinedWord = combinedWord.toUpperCase();

  setAllLetters((prev) => {
    const next = prev.map((l) => ({ ...l, used: false }));

    for (const char of combinedWord) {
      const letter = next.find((l) => !l.used && l.char === char);
      if (letter) {
        letter.used = true;
      }
    }

    return next;
  });
};