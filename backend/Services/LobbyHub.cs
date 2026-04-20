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

  public async Task FinishGame(string lobbyId)
  {
    await Clients.Group(lobbyId).SendAsync("MatchEnded", lobbyId);

    Console.WriteLine($"Lobby {lobbyId} has finished by a player.");
  }
  public async Task StopGame(string lobbyId, string stoppedByPlayerId, int score)
  {
    await Clients.Group(lobbyId).SendAsync("GameStopped", lobbyId, stoppedByPlayerId, score);
    Console.WriteLine($"Lobby {lobbyId}: Player {stoppedByPlayerId} stopped the game with score {score}.");
  }
  public async Task SubmitWord(string lobbyId, string playerId, string category, string word)
  {
      await Clients.Group(lobbyId).SendAsync("WordSubmitted", playerId, category, word.Trim().ToUpperInvariant());
      Console.WriteLine($"Lobby {lobbyId}: Player {playerId} submitted '{word}' in '{category}'");
  }

  // A signalR to manage restart the game/ new round
  public async Task LobbyReset(string lobbyId)
  {
    await Clients.Group(lobbyId).SendAsync("LobbyReset", lobbyId);
  }

  // A signalR to notify when a player votes to restart
  public async Task PlayerRestartVote(string lobbyId, string playerId)
  {
    await Clients.Group(lobbyId).SendAsync("PlayerRestartVote", playerId);
  }

  // A signalR to manage the lobby state when one player leavs the lobby
  public async Task PlayerLeft(string lobbyId, string playerId)
  {
    await Clients.Group(lobbyId).SendAsync("PlayerLeft", playerId);
  }

  // A signalR to manage the new host it the previous one has left
  public async Task HostChanged(string lobbyId, string newHostId)
  {
    await Clients.Group(lobbyId).SendAsync("HostChanged", newHostId);
  }

}