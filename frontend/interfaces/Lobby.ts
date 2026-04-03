export interface LobbyState {
  lobbyId: string
  status: 'waiting' | 'ready' | 'started'
}
export interface CreateLobbyResponse {
  lobbyId: string
  playerToken: string
  status: string
}
export interface JoinLobbyProps {
  lobbyId: string
}