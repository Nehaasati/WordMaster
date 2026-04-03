import React, { useState, useEffect } from 'react'
import './GamePage.css'

const GamePage: React.FC = () => {
  interface Letter {
    id: string;
    char: string;
    used: boolean;
    isExtra: boolean;
  }

  const [allLetters, setAllLetters] = useState<Letter[]>([])
  const [colorWord, setColorWord] = useState('')
  const [foodWord, setFoodWord] = useState('')
  const [colorValid, setColorValid] = useState(false)
  const [foodValid, setFoodValid] = useState(false)

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'

  // Weighted randomizer to reduce duplicates
  const generateRandomLetters = (count: number, currentLetters: Letter[] = [], isExtra: boolean = false) => {
    const letters: Letter[] = []
    
    for (let i = 0; i < count; i++) {
      // Calculate current letter frequencies in existing pool + what we just generated
      const pool = [...currentLetters, ...letters].map(l => l.char)
      const frequencies: Record<string, number> = {}
      for (const char of pool) {
        frequencies[char] = (frequencies[char] || 0) + 1
      }

      // Filter alphabet to avoid too many duplicates (max 2 of same)
      let availableChars = ALPHABET.split('').filter(char => (frequencies[char] || 0) < 2)
      
      // If we filtered everything (unlikely), reset to full alphabet
      if (availableChars.length === 0) availableChars = ALPHABET.split('')

      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)]
      
      letters.push({
        id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        char: randomChar,
        used: false,
        isExtra
      })
    }
    return letters
  }

  useEffect(() => {
    setAllLetters(generateRandomLetters(15))
  }, [])

  const addExtraLetters = () => {
    setAllLetters(prev => [...prev, ...generateRandomLetters(5, prev, true)])
  }

  const updateUsedLetters = (word1: string, word2: string) => {
    const w1 = colorValid ? '' : word1
    const w2 = foodValid ? '' : word2
    const combinedWord = (w1 + w2).toUpperCase()

    setAllLetters(prev => {
      // Reset used status first
      const nextLetters = prev.map(l => ({ ...l, used: false }))
      
      // Mark as used one by one
      for (const char of combinedWord) {
        const letter = nextLetters.find(l => !l.used && l.char === char)
        if (letter) {
          letter.used = true
        }
      }
      return nextLetters
    })
  }

  const checkWordWithLetters = (word: string, otherWord: string, isColor: boolean) => {
    const wordUpper = word.toUpperCase()
    const otherUpper = otherWord.toUpperCase()
    const combined = wordUpper + ((isColor ? foodValid : colorValid) ? '' : otherUpper)
    
    const pool = allLetters.map(l => l.char)
    for (const char of combined) {
      const index = pool.indexOf(char)
      if (index === -1) return false
      pool.splice(index, 1)
    }
    return true
  }

  const validateWord = async (word: string, category: string, setValid: (v: boolean) => void, otherWord: string) => {
    if (word.length < 2) {
      setValid(false)
      return
    }

    if (!checkWordWithLetters(word, otherWord, category === 'Colour')) {
      setValid(false)
      return
    }

    try {
      const url = 'http://127.0.0.1:5024/api/word/validate'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ word: word.trim(), category })
      })
      
      if (!response.ok) {
        setValid(false)
        return
      }

      const data = await response.json()
      if (data.isValid) {
        // Omedelbar ersättning när ordet är godkänt medan bokstäverna fortfarande är markerade som 'used'
        setAllLetters(prev => {
          const unusedLetters = prev.filter(l => !l.used)
          return prev.map(l => {
            if (l.used) {
              return generateRandomLetters(1, unusedLetters, l.isExtra)[0]
            }
            return l
          })
        })
        
        // Sätt valid efteråt för att trigga omräkning av använda bokstäver för det ANDRA fältet
        setValid(true)
      } else {
        setValid(false)
      }
    } catch (error: any) {
      setValid(false)
    }
  }


  useEffect(() => {
    updateUsedLetters(colorWord, foodWord)
  }, [colorWord, foodWord, colorValid, foodValid])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    if (colorValid) setColorValid(false)

    if (val.length > colorWord.length) {
      const addedChar = val[val.length - 1]
      const currentOtherWord = foodValid ? '' : foodWord
      const combined = (val + currentOtherWord).toUpperCase()
      
      const charCountInWord = combined.split('').filter(c => c === addedChar).length
      const charCountInPool = allLetters.filter(l => l.char === addedChar).length
      
      if (charCountInPool < charCountInWord) return
    }
    
    setColorWord(val)
    validateWord(val, 'Colour', setColorValid, foodWord)
  }

  const handleFoodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    if (foodValid) setFoodValid(false)

    if (val.length > foodWord.length) {
      const addedChar = val[val.length - 1]
      const currentOtherWord = colorValid ? '' : colorWord
      const combined = (val + currentOtherWord).toUpperCase()
      
      const charCountInWord = combined.split('').filter(c => c === addedChar).length
      const charCountInPool = allLetters.filter(l => l.char === addedChar).length
      
      if (charCountInPool < charCountInWord) return
    }
    
    setFoodWord(val)
    validateWord(val, 'Food', setFoodValid, colorWord)
  }

  return (
      <div className="wm-scene game-page" data-testid="game-page">
      <div className="wm-bg" />
      <div className="wm-overlay" />
      <div className="wm-vignette" />

      <div className="disclaimer-text">
        Detta är bara för testning, vi saknar front end m.m / Oskar
      </div>

      <div className="inputs-container">
        <div className="input-group">
          <label>Färg</label>
          <input
            type="text"
            className={`category-input ${colorValid ? 'valid' : ''}`}
            value={colorWord}
            onChange={handleColorChange}
            placeholder=""
          />
        </div>
        <div className="input-group">
          <label>Mat</label>
          <input
            type="text"
            className={`category-input ${foodValid ? 'valid' : ''}`}
            value={foodWord}
            onChange={handleFoodChange}
            placeholder=""
          />
        </div>
      </div>

      <div className="game-right-side">
        <button className="extra-letters-btn" onClick={addExtraLetters}>
          Fler bokstäver för testning
        </button>
        <div className="letters-container">
          {allLetters.map((letter) => (
            <div 
              key={letter.id} 
              className={`letter-box ${letter.isExtra ? 'extra' : ''} ${letter.used ? 'used' : ''}`}
            >
              {letter.char}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GamePage
