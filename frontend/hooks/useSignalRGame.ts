import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSignalR } from "../interfaces/SignalRContext";

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
  },
) {
  const connection = useSignalR();
  const navigate = useNavigate();

  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const navigatingRef = useRef(false);

  useEffect(() => {
    if (!connection || !lobbyId) return;

    console.log("useSignalRGame → using connection:", connection.connectionId);

    // Join group
    connection.invoke("JoinLobbyGroup", lobbyId);

    // -------------------------
    // EVENTS
    // -------------------------

    connection.on("LobbyReset", () => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      handlersRef.current.onLobbyReset?.();
      navigate(`/lobby/${lobbyId}`);
    });

    connection.on("PlayerLeft", (playerId: string) => {
      handlersRef.current.onPlayerLeft?.(playerId);
    });

    connection.on("GameStopped", (lId, stoppedBy, score) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      handlersRef.current.onGameStopped?.(lId, stoppedBy, score);
    });

    connection.on("HostChanged", (newHostId: string) => {
      handlersRef.current.onHostChanged?.(newHostId);
    });

    connection.on("MatchEnded", (lId: string) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      handlersRef.current.onMatchEnded?.(lId);
    });

    connection.on("WordSubmitted", (senderId, category, word) => {
      handlersRef.current.onWordSubmitted?.(senderId, category, word);
    });

    // -------------------------
    // CLEANUP
    // -------------------------
    return () => {
      connection.off("LobbyReset");
      connection.off("PlayerLeft");
      connection.off("GameStopped");
      connection.off("HostChanged");
      connection.off("MatchEnded");
      connection.off("WordSubmitted");
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

  return { submitWord };
}