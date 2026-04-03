export interface LobbyState {
  lobbyId: string
  status: 'waiting' | 'ready' | 'started'
}