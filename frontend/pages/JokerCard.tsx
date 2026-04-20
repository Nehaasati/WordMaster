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
 
  const handleClick = () => {
    console.log(`[JokerButton] Click - score=${score}, canAfford=${canAfford}, isActive=${isActive}, stopped=${stopped}, isDisabled=${isDisabled}`);
    if (!isDisabled) {
      onActivate();
    } else {
      if (stopped) console.log('[JokerButton] Disabled: Game stopped');
      if (isActive) console.log('[JokerButton] Disabled: Joker already active');
      if (!canAfford) console.log(`[JokerButton] Disabled: Not enough points (${score} < 10)`);
    }
  };

  return (
    <button
      className={`gp-btn gp-btn--joker ${isActive ? 'gp-btn--joker-active' : ''} ${!canAfford || isActive ? 'gp-btn--disabled' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
      data-testid="btn-joker"
      title={isActive ? `Joker aktiv: ${jokerLetter}` : 'Kostar 10 poäng — bokstav ger dubbla poäng'}
    >
      {isActive ? `🃏 ${jokerLetter}` : '🃏 Joker (10p)'}
    </button>
  );
};

export default JokerButton;