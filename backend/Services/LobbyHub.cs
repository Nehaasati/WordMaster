using Microsoft.AspNetCore.SignalR;
using WordMaster.Services;

// This hub is used for real-time updates in the lobby (e.g., when players join or leave).
public class LobbyHub : Hub
{
  private readonly GameEngine _engine;
  private readonly CharacterService _characterService;

  public LobbyHub(GameEngine engine, CharacterService characterService)
  {
    _engine = engine;
    _characterService = characterService;
  }
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
    var result = ComputeScores(lobbyId, stopperPlayerId: null);
    PersistScores(lobbyId, result.TotalScores);
    await Clients.Group(lobbyId).SendAsync("MatchEnded", lobbyId, result.TotalScores);
    Console.WriteLine($"Lobby {lobbyId} finished.");
  }
  public async Task StopGame(string lobbyId, string stoppedByPlayerId)
  {
    var result = ComputeScores(lobbyId, stopperPlayerId: stoppedByPlayerId);
    PersistScores(lobbyId, result.TotalScores);
    await Clients.Group(lobbyId).SendAsync("GameStopped", lobbyId, stoppedByPlayerId, result.TotalScores);
    Console.WriteLine($"Lobby {lobbyId}: Player {stoppedByPlayerId} stopped the game.");
  }
  public async Task SubmitWord(string lobbyId, string playerId, string category, string word)
  {
    var normalized = word.Trim().ToUpperInvariant();
    _engine.SaveSubmittedWord(lobbyId, playerId, category, normalized);

    await Clients.Group(lobbyId).SendAsync("WordSubmitted", playerId, category, normalized);

    var result = ComputeScores(lobbyId, stopperPlayerId: null);
    await Clients.Group(lobbyId).SendAsync("ScoreUpdate", new
    {
      totalScores = result.TotalScores,
      categoryPoints = result.CategoryPoints
    });

    Console.WriteLine($"Lobby {lobbyId}: Player {playerId} submitted '{normalized}' in '{category}'");
  }

  // A signalR to manage restart the game/ new round
  public async Task LobbyReset(string lobbyId)
  {
    await Clients.Group(lobbyId).SendAsync("LobbyReset", lobbyId);
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
  private ScoreCalculator.ScoreResult ComputeScores(string lobbyId, string? stopperPlayerId)
  {
    var lobby = _engine.GetLobby(lobbyId);
    if (lobby == null)
      return new ScoreCalculator.ScoreResult(
        new Dictionary<string, int>(),
        new Dictionary<string, Dictionary<string, int>>()
      );

    var submissions = new Dictionary<string, Dictionary<string, ScoreCalculator.CategorySubmission>>();
    var playerContexts = new Dictionary<string, ScoreCalculator.PlayerContext>();
    var gameStart = lobby.GameStartTime ?? DateTime.UtcNow;

    foreach (var player in lobby.Players)
    {
      var words = lobby.SubmittedWords.TryGetValue(player.Id, out var w)
        ? w : new Dictionary<string, string>();
      var timestamps = lobby.WordTimestamps.TryGetValue(player.Id, out var t)
        ? t : new Dictionary<string, DateTime>();

      var catSubs = new Dictionary<string, ScoreCalculator.CategorySubmission>();
      var secondsPerCat = new Dictionary<string, double>();

      foreach (var kvp in words)
      {
        catSubs[kvp.Key] = new ScoreCalculator.CategorySubmission(kvp.Value, true);
        if (timestamps.TryGetValue(kvp.Key, out var ts))
          secondsPerCat[kvp.Key] = (ts - gameStart).TotalSeconds;
      }

      submissions[player.Id] = catSubs;
      playerContexts[player.Id] = new ScoreCalculator.PlayerContext(player.CharacterId, secondsPerCat);
    }

    return ScoreCalculator.Calculate(submissions, stopperPlayerId, playerContexts, _characterService);
  }

  private void PersistScores(string lobbyId, Dictionary<string, int> scores)
  {
    var lobby = _engine.GetLobby(lobbyId);
    if (lobby == null) return;

    foreach (var player in lobby.Players)
    {
      if (scores.TryGetValue(player.Id, out var score))
        player.Score = score;
    }
  }

}