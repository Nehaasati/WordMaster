import { createContext, useContext } from "react";
import { HubConnection } from "@microsoft/signalr";

export type SignalRContextValue = {
  connection: HubConnection | null;
  status: "Disconnected" | "Connecting" | "Connected" | "Reconnecting";
};

export const SignalRContext = createContext<SignalRContextValue>({
  connection: null,
  status: "Disconnected",
});

export const useSignalR = () => useContext(SignalRContext).connection;
export const useSignalRStatus = () => useContext(SignalRContext).status;
