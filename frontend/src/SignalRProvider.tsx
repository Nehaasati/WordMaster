import React, { useEffect, useState } from "react";
import { HubConnection } from "@microsoft/signalr";
import {
  SignalRContext,
  type SignalRContextValue,
} from "../hooks/SignalRContext";
import { signalRManager } from "../hooks/connectionManager";

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [status, setStatus] =
    useState<SignalRContextValue["status"]>("Disconnected");

  useEffect(() => {
    let mounted = true;

    setStatus("Connecting");

    signalRManager
      .start()
      .then((conn) => {
        if (!mounted) return;
        setConnection(conn);
        setStatus("Connected");

        conn.onclose(() => setStatus("Disconnected"));
        conn.onreconnecting(() => setStatus("Reconnecting"));
        conn.onreconnected(() => setStatus("Connected"));
      })
      .catch((err) => {
        console.error("SignalR start error:", err);
        if (mounted) setStatus("Disconnected");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SignalRContext.Provider value={{ connection, status }}>
      {children}
    </SignalRContext.Provider>
  );
};
