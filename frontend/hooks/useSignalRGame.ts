import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSignalR } from "./SignalRContext";

export function useSignalRGame(
  lobbyId: string | undefined,
  handlers: {
    onLobbyReset?: () => void;
    onPlayerLeft?: (playerId: string) => void;
    onGameStopped?: (lobbyId: string, stoppedBy: string, scores: Record<string, number>) => void;
    onHostChanged?: (newHostId: string) => void;
    onMatchEnded?: (lobbyId: string, scores: Record<string, number>) => void;
    onScoreUpdate?: (update: { totalScores: Record<string, number>; categoryPoints: Record<string, Record<string, number>> }) => void;
    onWordSubmitted?: (
      senderId: string,
      category: string,
      word: string,
    ) => void;
    onFreezeReceived?: () => void;
    onInkReceived?: () => void;
  },
) {
  const connection = useSignalR();
  const navigate = useNavigate();

  const handlersRef = useRef(handlers);
  const navigatingRef = useRef(false);

  // keep latest handlers without re-binding events
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!connection || !lobbyId) return;

    console.log("useSignalRGame → using connection:", connection.connectionId);

    // -------------------------
    // JOIN GROUP
    // -------------------------
    const joinLobbyGroup = async () => {
      try {
        await connection.invoke("JoinLobbyGroup", lobbyId);
      } catch (err) {
        console.error("JoinLobbyGroup error:", err);
      }
    };

    joinLobbyGroup();

    connection.onreconnected(() => {
      console.log("Reconnected → rejoining group:", lobbyId);
      joinLobbyGroup();
    });

    // -------------------------
    // HANDLERS (stable references)
    // -------------------------

    const handleLobbyReset = () => {
      handlersRef.current.onLobbyReset?.();
    };

    const handlePlayerLeft = (playerId: string) => {
      handlersRef.current.onPlayerLeft?.(playerId);
    };

    const handleGameStopped = (
      lId: string,
      stoppedBy: string,
      scores: Record<string, number>,
    ) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      handlersRef.current.onGameStopped?.(lId, stoppedBy, scores);
    };

    const handleHostChanged = (newHostId: string) => {
      handlersRef.current.onHostChanged?.(newHostId);
    };

    const handleMatchEnded = (lId: string, scores: Record<string, number>) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      handlersRef.current.onMatchEnded?.(lId, scores);
    };

    const handleWordSubmitted = (
      senderId: string,
      category: string,
      word: string,
    ) => {
      handlersRef.current.onWordSubmitted?.(senderId, category, word);
    };

    // Added handlers for abilities (freeze and ink)
    const handleFreezeReceived = () => {
      handlersRef.current.onFreezeReceived?.();
    };

    const handleInkReceived = () => {
      handlersRef.current.onInkReceived?.();
    };
    const handleScoreUpdate = (update: { totalScores: Record<string, number>; categoryPoints: Record<string, Record<string, number>> }) => {
      if (navigatingRef.current) return;
      handlersRef.current.onScoreUpdate?.(update);
    };
    // -------------------------
    // REGISTER EVENTS
    // -------------------------
    connection.on("LobbyReset", handleLobbyReset);
    connection.on("PlayerLeft", handlePlayerLeft);
    connection.on("GameStopped", handleGameStopped);
    connection.on("HostChanged", handleHostChanged);
    connection.on("MatchEnded", handleMatchEnded);
    connection.on("WordSubmitted", handleWordSubmitted);
    connection.on("FreezeReceived", handleFreezeReceived);
    connection.on("InkReceived", handleInkReceived);
    connection.on("ScoreUpdate", handleScoreUpdate);

    // -------------------------
    // CLEANUP (IMPORTANT)
    // -------------------------
    return () => {
      connection.off("LobbyReset", handleLobbyReset);
      connection.off("PlayerLeft", handlePlayerLeft);
      connection.off("GameStopped", handleGameStopped);
      connection.off("HostChanged", handleHostChanged);
      connection.off("MatchEnded", handleMatchEnded);
      connection.off("WordSubmitted", handleWordSubmitted);
      connection.off("FreezeReceived", handleFreezeReceived);
      connection.off("InkReceived", handleInkReceived);
      connection.off("ScoreUpdate", handleScoreUpdate);
    };
  }, [connection, lobbyId, navigate]);

  // -------------------------
  // ACTIONS
  // -------------------------
  const submitWord = useCallback((categoryId: string, word: string) => {
    if (!connection || !lobbyId) return;

    const myId = localStorage.getItem("wordmaster-player-id") ?? "";
    const normalized = word.trim().toUpperCase();

    connection
      .invoke("SubmitWord", lobbyId, myId, categoryId, normalized)
      .catch((err) => console.error("SubmitWord error:", err));
  }, [connection, lobbyId]);

  const stopGame = useCallback(() => {
    if (!connection || !lobbyId) return;

    const playerId = localStorage.getItem("wordmaster-player-id") ?? "";

    connection
      .invoke("StopGame", lobbyId, playerId)
      .catch((err) => console.error("StopGame error:", err));
  }, [connection, lobbyId]);
  const finishGame = useCallback(() => {
    if (!connection || !lobbyId) return;
    connection
      .invoke("FinishGame", lobbyId)
      .catch((err) => console.error("FinishGame error:", err));
  }, [connection, lobbyId]);

  return { submitWord, stopGame, finishGame};
}
