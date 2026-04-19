// gameService.ts - Game control functions and powerup handlers

export const stopGame = async (
  connection: any,
  lobbyId: string | undefined,
) => {
  if (!connection || !lobbyId) return;

  const myPlayerId = localStorage.getItem("wordmaster-player-id") ?? "";

  try {
    await connection.invoke(
      "StopGame",
      lobbyId,
      myPlayerId,
      0, // score will be calculated server-side
    );
  } catch (err) {
    console.error("SignalR StopGame error:", err);
  }
};

export const handleRestart = async (lobbyId: string | undefined) => {
  const playerId = localStorage.getItem("wordmaster-player-id");

  if (!lobbyId || !playerId) return;

  await fetch(`/api/lobby/${lobbyId}/restart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });
};

export const handleLeave = async (lobbyId: string | undefined) => {
  const playerId = localStorage.getItem("wordmaster-player-id");

  if (!lobbyId || !playerId) return;

  await fetch(`/api/lobby/${lobbyId}/leave/${playerId}`, { method: "POST" });
};

export const handleFreeze = (
  setFrozen: (frozen: boolean) => void,
  setFreezeActive: (active: boolean) => void,
  setShowFreeze: (show: boolean) => void,
  setFreezeMsg: (msg: string) => void,
) => {
  setFrozen(true);
  setFreezeActive(true);
  setShowFreeze(true);
  setFreezeMsg("❄️ Fryser tiden!");

  // Remove freeze after 5 seconds
  setTimeout(() => {
    setFrozen(false);
    setFreezeActive(false);
    setShowFreeze(false);
    setFreezeMsg("");
  }, 5000);
};

export const handleFreezePowerup = async (
  lobbyId: string | undefined,
  connection: any,
  handleFreeze: () => void,
) => {
  if (lobbyId && connection) {
    connection.invoke("UseFreeze", lobbyId);
  } else {
    handleFreeze();
  }
};

export const handleMix = (
  setAllLetters: (setter: (prev: any[]) => any[]) => void,
) => {
  setAllLetters((prev) => {
    const shuffled = [...prev];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
};

export const handleStopGame = async (
  lobbyId: string | undefined,
  stopGame: () => Promise<void>,
) => {
  if (!lobbyId) return;
  const myPlayerId = localStorage.getItem("wordmaster-player-id") ?? "";
  try {
    await fetch(`/api/lobby/${lobbyId}/save-score/${myPlayerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: 0 }), // score will be from ref
    });
  } catch {
    console.error("Failed to save score before stopping");
  }
  await stopGame();
};
