import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSignalR } from "./SignalRContext";

export function useSignalRGame(
  lobbyId: string | undefined,
  handlers: {
    onLobbyReset?: () => void;
    onPlayerLeft?: (playerId: string) => void;
    onGameStopped?: (lobbyId: string, stoppedBy: string, score: number) => void;
    onHostChanged?: (newHostId: string) => void;
    onMatchEnded?: (lobbyId: string) => void;
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
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      handlersRef.current.onLobbyReset?.();
      navigate(`/lobby/${lobbyId}`);
    };

    const handlePlayerLeft = (playerId: string) => {
      handlersRef.current.onPlayerLeft?.(playerId);
    };

    const handleGameStopped = (
      lId: string,
      stoppedBy: string,
      score: number,
    ) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      handlersRef.current.onGameStopped?.(lId, stoppedBy, score);
    };

    const handleHostChanged = (newHostId: string) => {
      handlersRef.current.onHostChanged?.(newHostId);
    };

    const handleMatchEnded = (lId: string) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      handlersRef.current.onMatchEnded?.(lId);
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
    };
  }, [connection, lobbyId, navigate]);

  // -------------------------
  // ACTIONS
  // -------------------------
  const submitWord = (categoryId: string, word: string) => {
    if (!connection || !lobbyId) return;

    const myId = localStorage.getItem("wordmaster-player-id") ?? "";
    const normalized = word.trim().toUpperCase();

    connection
      .invoke("SubmitWord", lobbyId, myId, categoryId, normalized)
      .catch((err) => console.error("SubmitWord error:", err));
  };

  const stopGame = (score: number) => {
    if (!connection || !lobbyId) return;

    const playerId = localStorage.getItem("wordmaster-player-id") ?? "";

    connection
      .invoke("StopGame", lobbyId, playerId, Math.round(score))
      .catch((err) => console.error("StopGame error:", err));
  };

  return { submitWord, stopGame };
}