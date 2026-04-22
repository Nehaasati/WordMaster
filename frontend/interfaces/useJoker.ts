import { useState, useCallback, useRef } from 'react';

interface JokerState {
  jokerLetter: string | null;
  isActive: boolean;
  isUsed: boolean;
}

interface UseJokerReturn {
  joker: JokerState;
  jokerMsg: string;
  jokerCategoriesRef: React.MutableRefObject<Set<string>>;
  activateJoker: (currentScore: number) => Promise<number | null>;
  applyJoker: (word: string, categoryId: string) => Promise<number>;
}

export function useJoker(
  lobbyId: string | undefined,
  playerId: string | undefined,
): UseJokerReturn {
  const [joker, setJoker] = useState<JokerState>({
    jokerLetter: null,
    isActive: false,
    isUsed: false,
  });
  const [jokerMsg, setJokerMsg] = useState('');

  // Tracks which categories had joker applied — used in score calculation
  const jokerCategoriesRef = useRef<Set<string>>(new Set());

  const showMsg = (msg: string) => {
    setJokerMsg(msg);
    setTimeout(() => setJokerMsg(''), 3500);
  };

  const activateJoker = useCallback(async (currentScore: number): Promise<number | null> => {
    if (!lobbyId || !playerId) {
      showMsg('Inget lobby eller spelare hittades.');
      return null;
    }

    if (joker.isActive) {
      showMsg('Du har redan en aktiv Joker!');
      return null;
    }

    try {
      const res = await fetch(
        `/api/lobby/${lobbyId}/joker/${playerId}/activate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentScore })
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showMsg(err.error || 'Kunde inte aktivera Joker.');
        return null;
      }

      const data = await res.json();
      setJoker({ jokerLetter: data.jokerLetter, isActive: true, isUsed: false });
      showMsg(`🃏 Joker aktiverad! Bokstav: ${data.jokerLetter} — dubbla poäng!`);
      console.log('[Joker] Activated:', data.jokerLetter);
      return data.newScore ?? null;
    } catch (err) {
      console.error('[Joker] Activation error:', err);
      showMsg('Fel vid aktivering av Joker.');
      return null;
    }
  }, [lobbyId, playerId, joker.isActive]);

  // ── Apply — called after word is validated ────────────────
  const applyJoker = useCallback(async (
    word: string,
    categoryId: string
  ): Promise<number> => {
    if (!lobbyId || !playerId || !joker.isActive || !joker.jokerLetter) return 1;

    // Check locally if word contains joker letter
    const wordContainsJoker = word
      .toUpperCase()
      .includes(joker.jokerLetter.toUpperCase());

    if (!wordContainsJoker) return 1;

    try {
      const res = await fetch(
        `/api/lobby/${lobbyId}/joker/${playerId}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, category: categoryId, usedWildcard: false }),
        }
      );

      if (!res.ok) return 1;

      const data = await res.json();

      if (data.jokerTriggered) {
        // Mark joker as consumed
        setJoker({ jokerLetter: null, isActive: false, isUsed: true });
        // Remember this category gets doubled score
        jokerCategoriesRef.current.add(categoryId);
        showMsg(`🃏 JOKER! Dubbla poäng för "${word}"!`);
        console.log(`[Joker] Triggered for "${word}" in ${categoryId} | multiplier: ${data.multiplier}`);
      }

      return data.multiplier ?? 1;
    } catch (err) {
      console.error('[Joker] Apply error:', err);
      return 1;
    }
  }, [lobbyId, playerId, joker.isActive, joker.jokerLetter]);

  return {
    joker,
    jokerMsg,
    jokerCategoriesRef,
    activateJoker,
    applyJoker,
  };
}
