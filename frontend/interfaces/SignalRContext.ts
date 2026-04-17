import { createContext, useContext } from "react";
import { HubConnection } from "@microsoft/signalr";

export const SignalRContext = createContext<HubConnection | null>(null);

export const useSignalR = () => {
  return useContext(SignalRContext);
};
