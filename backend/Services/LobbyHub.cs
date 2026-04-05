using Microsoft.AspNetCore.SignalR;
using WordMaster.Services;

// This hub is used for real-time updates in the lobby (e.g., when players join or leave).
public class LobbyHub : Hub
{
  public override async Task OnConnectedAsync()
  {
    await base.OnConnectedAsync();
  }
  // Method to allow a player to join a lobby group. This is called from the client when they join a lobby, and it adds their connection to the SignalR group for that lobby so they can receive real-time updates.
  public async Task JoinLobbyGroup(string lobbyId)
{
    await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);

    Console.WriteLine($"Connection {Context.ConnectionId} joined lobby {lobbyId}");
}
  public async Task NotifyPlayerJoined(string lobbyId, Player player)
  {
    await Clients.Group(lobbyId).SendAsync("PlayerJoined", player);
  }

// method to notify players in the lobby when a player is ready. This can be called from the client when a player clicks a "Ready" button.
  public async Task PlayerReady(string lobbyId, string playerId)
  {
    await Clients.Group(lobbyId)
        .SendAsync("PlayerReady", playerId);
  }
}