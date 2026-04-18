import * as signalR from "@microsoft/signalr";

export const createConnection = () => {
  return new signalR.HubConnectionBuilder()
    .withUrl("/lobbyHub")
    .withAutomaticReconnect()
    .build();
};
