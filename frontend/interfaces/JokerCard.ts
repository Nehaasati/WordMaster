
import { useState, useCallback } from 'react';
 
const BASE_API = 'http://127.0.0.1:5024/api';
 
interface JokerState {
  jokerLetter: string | null;
  isActive: boolean;
  isUsed: boolean;
}
 
interface UseJokerReturn {
  joker: JokerState;
  jokerMsg: string;
  activateJoker: () => Promise<void>;
  applyJoker: (word: string, usedWildcard?: boolean) => Promise<number>;
  clearMsg: () => void;
}
 
export function useJoker(
  lobbyId: string | undefined,
  playerId: string | undefined,
  score: number,
  setScore: React.Dispatch<React.SetStateAction<number>>
): UseJokerReturn {
  const [joker, setJoker] = useState<JokerState>({
    jokerLetter: null,
    isActive: false,
    isUsed: false,
  });
  const [jokerMsg, setJokerMsg] = useState('');
 
  const showMsg = (msg: string) => {
    setJokerMsg(msg);
    setTimeout(() => setJokerMsg(''), 3500);
  };
 
  // ── Activate ──────────────────────────────────────────────
  const activateJoker = useCallback(async () => {
    if (!lobbyId || !playerId) return;

    if (joker.isActive) {
      showMsg('Du har redan en aktiv Joker!');
      return;
    }

    console.log(`[Joker] Checking score: ${score} (need 10+)`);
    if (score < 10) {
      showMsg(`Inte tillräckligt med poäng! Du har ${score} poäng, Joker kostar 10.`);
      return;
    }

    try {
      const res = await fetch(
        `${BASE_API}/lobby/${lobbyId}/joker/${playerId}/activate`,
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentScore: score })
        }
      );

      console.log(`[Joker API] Response status: ${res.status}`);
      
      if (!res.ok) {
        const err = await res.json();
        console.log(`[Joker API] Error:`, err);
        showMsg(err.error || 'Kunde inte aktivera Joker.');
        return;
      }

      const data = await res.json();
      console.log(`[Joker API] Success:`, data);
      setScore(data.newScore);
      setJoker({ jokerLetter: data.jokerLetter, isActive: true, isUsed: false });
      showMsg(`🃏 Joker aktiverad! Bokstav: ${data.jokerLetter} — dubbla poäng!`);
      console.log('Joker activated:', data.jokerLetter);
    } catch (error) {
      console.log(`[Joker API] Exception:`, error);
      showMsg('Fel vid aktivering av Joker.');
    }
  }, [lobbyId, playerId, joker.isActive, score, setScore]);
 
  // ── Apply ─────────────────────────────────────────────────
  // Called after a word is validated as correct.
  // Returns the bonus multiplier (1 = no bonus, 2 = double).
  const applyJoker = useCallback(async (word: string, usedWildcard: boolean = false): Promise<number> => {
    if (!lobbyId || !playerId || !joker.isActive) return 1;
 
    try {
      const res = await fetch(
        `${BASE_API}/lobby/${lobbyId}/joker/${playerId}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, usedWildcard }),
        }
      );
 
      if (!res.ok) return 1;
 
      const data = await res.json();
 
      if (data.jokerTriggered) {
        setJoker({ jokerLetter: null, isActive: false, isUsed: true });
        showMsg(`🃏 JOKER! Dubbla poäng för "${word}"!`);
        console.log(`Joker triggered by: ${word} | multiplier: ${data.multiplier}`);
      }
 
      return data.multiplier ?? 1;
    } catch {
      return 1;
    }
  }, [lobbyId, playerId, joker.isActive]);
 
  return {
    joker,
    jokerMsg,
    activateJoker,
    applyJoker,
    clearMsg: () => setJokerMsg(''),
  };
}