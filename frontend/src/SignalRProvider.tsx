import React, { useEffect, useState } from "react";
import { HubConnection } from "@microsoft/signalr";
import { SignalRContext } from "../interfaces/SignalRContext";
import { signalRManager } from "../interfaces/connectionManager";

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);

  useEffect(() => {
    let mounted = true;

    signalRManager.start().then((conn) => {
      if (mounted) setConnection(conn);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SignalRContext.Provider value={connection}>
      {children}
    </SignalRContext.Provider>
  );
};
