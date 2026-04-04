using Microsoft.AspNetCore.SignalR;
using WordMaster.Services;

// This hub is used for real-time updates in the lobby (e.g., when players join or leave).
public class LobbyHub : Hub
{
  public override async Task OnConnectedAsync()
  {
    await base.OnConnectedAsync();
  }
  public async Task JoinLobbyGroup(string lobbyId)
  {
    await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);
  }
  public async Task NotifyPlayerJoined(string lobbyId, Player player)
  {
    await Clients.Group(lobbyId).SendAsync("PlayerJoined", player);
  }
}