import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import './GamePage.css'

const GamePage: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  interface Letter {
    id: string;
    char: string;
    used: boolean;
    isExtra: boolean;
  }

  interface CategoryData {
    word: string;
    valid: boolean;
    feedback: string;
  }

  const CATEGORY_LIST = [
    { id: 'Colour', label: 'Färg' },
    { id: 'Food', label: 'Mat' },
    { id: 'Animal', label: 'Djur' },
    { id: 'Land', label: 'Land' },
    { id: 'Job', label: 'Jobb' },
    { id: 'Object', label: 'Objekt' }
  ]

  const [allLetters, setAllLetters] = useState<Letter[]>([])
  const [categories, setCategories] = useState<Record<string, CategoryData>>(() => {
    const initial: Record<string, CategoryData> = {}
    CATEGORY_LIST.forEach(cat => {
      initial[cat.id] = { word: '', valid: false, feedback: '' }
    })
    return initial
  })
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
    const checkBackend = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5024/api/health')
        setBackendConnected(response.ok)
      } catch {
        setBackendConnected(false)
      }
    }
    
    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchInitialLetters = async () => {
      try {
        const url = lobbyId 
          ? `http://127.0.0.1:5024/api/lobby/${lobbyId}`
          : 'http://127.0.0.1:5024/api/game/letters'
          
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          const letters: string[] = lobbyId ? data.letters : data;
          setAllLetters(letters.map(char => ({
            id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
            char,
            used: false,
            isExtra: false
          })))
        } else {
          setAllLetters(generateRandomLetters(15))
        }
      } catch {
        setAllLetters(generateRandomLetters(15))
      }
    }
    fetchInitialLetters()
  }, [lobbyId])

  const addExtraLetters = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5024/api/game/letters?count=5')
      if (response.ok) {
        const letters: string[] = await response.json()
        const newLetters = letters.map(char => ({
          id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          char,
          used: false,
          isExtra: true
        }))
        setAllLetters(prev => [...prev, ...newLetters])
      }
    } catch {
      setAllLetters(prev => [...prev, ...generateRandomLetters(5, prev, true)])
    }
  }

  const updateUsedLetters = () => {
    let combinedWord = ''
    for (const catId in categories) {
      if (!categories[catId].valid) {
        combinedWord += categories[catId].word
      }
    }
    combinedWord = combinedWord.toUpperCase()

    setAllLetters(prev => {
      const nextLetters = prev.map(l => ({ ...l, used: false }))
      for (const char of combinedWord) {
        const letter = nextLetters.find(l => !l.used && l.char === char)
        if (letter) {
          letter.used = true
        }
      }
      return nextLetters
    })
  }

  const checkWordWithLetters = (word: string, categoryId: string) => {
    const wordUpper = word.toUpperCase()
    
    // Get pool of available letters (all minus those used by OTHER non-valid categories)
    let otherUsedWord = ''
    for (const catId in categories) {
      if (catId !== categoryId && !categories[catId].valid) {
        otherUsedWord += categories[catId].word
      }
    }
    otherUsedWord = otherUsedWord.toUpperCase()

    const pool = allLetters.map(l => l.char)
    // Remove other used letters from pool first
    for (const char of otherUsedWord) {
      const index = pool.indexOf(char)
      if (index !== -1) pool.splice(index, 1)
    }

    // Now check if current word can be formed
    for (const char of wordUpper) {
      const index = pool.indexOf(char)
      if (index === -1) return false
      pool.splice(index, 1)
    }
    return true
  }

  const validateWord = async (word: string, categoryId: string) => {
    if (word.length === 0) {
      setCategories(prev => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], feedback: '', valid: false, word }
      }))
      return
    }

    if (word.length < 2) {
      setCategories(prev => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], feedback: 'Too short', valid: false, word }
      }))
      return
    }

    if (!checkWordWithLetters(word, categoryId)) {
      setCategories(prev => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], valid: false, word }
      }))
      return
    }

    try {
      // Determine letters available for THIS validation
      let otherUsedWord = ''
      for (const catId in categories) {
        if (catId !== categoryId && !categories[catId].valid) {
          otherUsedWord += categories[catId].word
        }
      }
      otherUsedWord = otherUsedWord.toUpperCase()
      
      const availablePool = allLetters.map(l => l.char)
      for (const char of otherUsedWord) {
        const index = availablePool.indexOf(char)
        if (index !== -1) availablePool.splice(index, 1)
      }

      const url = 'http://127.0.0.1:5024/api/word/validate'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ 
          word: word.trim(), 
          category: categoryId,
          letters: availablePool
        })
      })
      
      if (!response.ok) {
        setCategories(prev => ({
          ...prev,
          [categoryId]: { ...prev[categoryId], feedback: 'Error fetching', valid: false, word }
        }))
        return
      }

      const data = await response.json()
      if (data.isValid) {
        // Fetch replacement letters from backend
        let newLetterChars: string[] = []
        try {
          const resp = await fetch(`http://127.0.0.1:5024/api/game/letters?count=${word.length}`)
          if (resp.ok) newLetterChars = await resp.json()
        } catch { /* fallback to local generation below */ }

        setAllLetters(prev => {
          let replaceIdx = 0
          const currentUnused = prev.filter(l => !l.used)
          
          return prev.map(l => {
            if (l.used && word.toUpperCase().includes(l.char)) {
              // We need to be careful here to only replace the letters actually used for THIS word
              // But since we marked them 'used' in updateUsedLetters, we can find them.
              // Actually, a simpler way: if l.used is true now, and it matches a char in word, 
              // but we need to match exactly the number of chars.
            }
            return l
          })
        })

        // Re-implementing letter replacement more robustly
        setAllLetters(prev => {
          const nextLetters = [...prev]
          const wordUpper = word.toUpperCase()
          const charsToReplace = wordUpper.split('')
          
          for (let i = 0; i < nextLetters.length; i++) {
            const l = nextLetters[i]
            if (l.used) {
              const charIdx = charsToReplace.indexOf(l.char)
              if (charIdx !== -1) {
                // Replace this letter
                const newChar = newLetterChars[0] || generateRandomLetters(1, nextLetters.filter((_, idx) => idx !== i))[0].char
                if (newLetterChars.length > 0) newLetterChars.shift()
                
                nextLetters[i] = {
                  ...l,
                  char: newChar,
                  used: false,
                  id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
                }
                charsToReplace.splice(charIdx, 1)
              }
            }
          }
          return nextLetters
        })

        setCategories(prev => ({
          ...prev,
          [categoryId]: { ...prev[categoryId], feedback: '', valid: true, word }
        }))
      } else {
        setCategories(prev => ({
          ...prev,
          [categoryId]: { ...prev[categoryId], feedback: data.message || 'Word not found', valid: false, word }
        }))
      }
    } catch (error: any) {
      setCategories(prev => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], feedback: 'Error fetching', valid: false, word }
      }))
    }
  }


  // Automatic focus shift
  useEffect(() => {
    const nextCat = CATEGORY_LIST.find(cat => !categories[cat.id].valid)
    if (nextCat) {
      inputRefs.current[nextCat.id]?.focus()
    }
  }, CATEGORY_LIST.map(cat => categories[cat.id].valid))

  useEffect(() => {
    updateUsedLetters()
  }, [categories])

  const handleInputChange = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    
    // If it was valid, typing in it again (if allowed) should reset valid
    // But it's disabled when valid, so this only happens if we programmatically reset it.
    if (categories[categoryId].valid) {
      setCategories(prev => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], valid: false }
      }))
    }

    if (val.length > categories[categoryId].word.length) {
      const addedChar = val[val.length - 1]
      
      // Check if we have this letter available (not used by other NON-VALID categories)
      let otherUsedWord = ''
      for (const catId in categories) {
        if (catId !== categoryId && !categories[catId].valid) {
          otherUsedWord += categories[catId].word
        }
      }
      otherUsedWord = otherUsedWord.toUpperCase()
      
      const pool = allLetters.map(l => l.char)
      for (const char of otherUsedWord) {
        const index = pool.indexOf(char)
        if (index !== -1) pool.splice(index, 1)
      }

      const charCountInWord = val.split('').filter(c => c === addedChar).length
      const charCountInPool = pool.filter(c => c === addedChar).length
      
      if (charCountInPool < charCountInWord) return
    }
    
    validateWord(val, categoryId)
  }

  return (
      <div className="wm-scene game-page" data-testid="game-page">
      <div className="wm-bg" />
      <div className="wm-overlay" />
      <div className="wm-vignette" />

      <div className="disclaimer-text">
        Detta är bara för testning, vi saknar front end m.m / Oskar
        <div className="backend-status">
          Connected to backend: {backendConnected === null ? 'Checking...' : backendConnected ? 'Yes' : 'No'}
        </div>
      </div>

      <div className="inputs-container">
        {CATEGORY_LIST.map((cat) => (
          <div className="input-group" key={cat.id}>
            <label>{cat.label}</label>
            <input
              type="text"
              ref={(el) => inputRefs.current[cat.id] = el}
              className={`category-input ${categories[cat.id].valid ? 'valid' : ''}`}
              value={categories[cat.id].word}
              onChange={(e) => handleInputChange(cat.id, e)}
              placeholder=""
              disabled={categories[cat.id].valid}
            />
            <div className="feedback-message">{categories[cat.id].feedback}</div>
          </div>
        ))}
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
