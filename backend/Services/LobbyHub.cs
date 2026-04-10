using Microsoft.AspNetCore.SignalR;
using WordMaster.Services;

// This hub is used for real-time updates in the lobby (e.g., when players join or leave).
public class LobbyHub : Hub
{
  public override async Task OnConnectedAsync()
  {
    // Log the new connection for debugging purposes
    Console.WriteLine($"SignalR connected: {Context.ConnectionId}");
    await base.OnConnectedAsync();
  }
  // Method to allow a player to join a lobby group. This is called from the client when they join a lobby, and it adds their connection to the SignalR group for that lobby so they can receive real-time updates.
  public async Task JoinLobbyGroup(string lobbyId)
  {
    if (string.IsNullOrWhiteSpace(lobbyId))
      return;

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

  // Method to notify players in the lobby when a round has ended.
  public async Task MatchEnded(string lobbyId)
  {
    await Clients.Group(lobbyId).SendAsync("MatchEnded", lobbyId);
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    Console.WriteLine($"SignalR disconnected: {Context.ConnectionId}");

    await base.OnDisconnectedAsync(exception);
  }


  public async Task UseInk(string lobbyId)
  {
    await Clients.OthersInGroup(lobbyId).SendAsync("InkReceived");
  }

  public async Task UseFreeze(string lobbyId)
  {
    await Clients.OthersInGroup(lobbyId).SendAsync("FreezeReceived");
  }
}