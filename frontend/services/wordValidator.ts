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
  const usedLetterIds = new Set<string>();
  const fallbackUsedWordParts: string[] = [];

  setAllLetters((prev) => {
    const next = prev.map((l) => ({ ...l, used: false }));

    for (const catId in categories) {
      const category = categories[catId];
      if (category.valid) {
        continue;
      }

      if (category.letterIds.length > 0) {
        for (const id of category.letterIds) {
          usedLetterIds.add(id);
        }
      } else {
        fallbackUsedWordParts.push(category.word.toUpperCase());
      }
    }

    for (const letter of next) {
      if (usedLetterIds.has(letter.id)) {
        letter.used = true;
      }
    }

    for (const char of fallbackUsedWordParts.join("")) {
      const letter = next.find((l) => !l.used && l.char === char);
      if (letter) {
        letter.used = true;
      }
    }

    return next;
  });
};
