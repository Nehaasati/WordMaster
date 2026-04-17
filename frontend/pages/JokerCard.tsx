import React from 'react';
 
interface JokerButtonProps {
  isActive: boolean;
  jokerLetter: string | null;
  score: number;
  stopped: boolean;
  onActivate: () => void;
}
 
const JokerButton: React.FC<JokerButtonProps> = ({
  isActive,
  jokerLetter,
  score,
  stopped,
  onActivate,
}) => {
  const canAfford  = score >= 10;
  const isDisabled = stopped || isActive || !canAfford;
 
  return (
    <button
      className={`gp-btn gp-btn--joker ${isActive ? 'gp-btn--joker-active' : ''} ${!canAfford || isActive ? 'gp-btn--disabled' : ''}`}
      onClick={onActivate}
      disabled={isDisabled}
      data-testid="btn-joker"
      title={isActive ? `Joker aktiv: ${jokerLetter}` : 'Kostar 10 poäng — bokstav ger dubbla poäng'}
    >
      {isActive ? `🃏 ${jokerLetter}` : '🃏 Joker (10p)'}
    </button>
  );
};
 
export default JokerButton;
 