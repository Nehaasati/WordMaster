using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests;

public class GameEngineTests
{
    private Player CreateHost(string name = "Host") => new Player { Name = name };

    private GameEngine CreateEngine()
    {
        var validator = new WordValidator();

        var dictionary = new HashSet<string>
        {
            "APPLE",
            "DOG",
            "CAT"
        };

        var categories = new Dictionary<string, List<string>>
        {
            { "Animal", new List<string> { "DOG", "CAT" } },
            { "Fruit", new List<string> { "APPLE" } }
        };

        return new GameEngine(validator, dictionary, categories);
    }


    [Fact]
    public void CreateLobby_ShouldCreateLobby()
    {
        var engine = CreateEngine();

        var host = new Player { Name = "Host" };
        var lobby = engine.CreateLobby(host);

        Assert.NotNull(lobby);
        Assert.NotNull(lobby.Id);
        Assert.NotNull(lobby.InviteCode);
    }


    [Fact]
    public void GetLobby_ShouldReturnLobby_WhenExists()
    {
        var engine = CreateEngine();

        var lobby = engine.CreateLobby(CreateHost());

        var result = engine.GetLobby(lobby.Id);

        Assert.NotNull(result);
    }


    [Fact]
    public void GetLobby_ShouldReturnLobby_WhenInviteCodeUsed()
    {
        var engine = CreateEngine();

        var lobby = engine.CreateLobby(CreateHost());

        var result = engine.GetLobby(lobby.InviteCode);

        Assert.NotNull(result);
    }


    [Fact]
    public void GenerateLetters_ShouldReturnCorrectCount()
    {
        var engine = CreateEngine();

        var letters = engine.GenerateLetters(10);

        Assert.Equal(10, letters.Count);
    }


    [Fact]
    public void TryJoinLobby_ShouldAddPlayer()
    {
        var engine = CreateEngine();
        var lobby = engine.CreateLobby(CreateHost());

        var player = new Player { Name = "Anna" };

        var result = engine.TryJoinLobby(lobby.Id, player, out var error);

        Assert.True(result);
        Assert.Equal(2, lobby.Players.Count);
    }

    // Test that a player cannot join a lobby that is already full (2 players)
    [Fact]
    public void TryJoinLobby_ShouldFail_WhenLobbyIsFull()
    {
        var engine = CreateEngine();
        var lobby = engine.CreateLobby(CreateHost());

        var p1 = new Player { Name = "A" };
        var p2 = new Player { Name = "B" };

        engine.TryJoinLobby(lobby.Id, p1, out _);

        var result = engine.TryJoinLobby(lobby.Id, p2, out var error);

        Assert.False(result);
        Assert.Equal("Tyvärr är Lobbyn full och kan inte ta emot fler spelare.", error);
    }

    // Test that rejoining the same player returns success for the existing lobby entry
    [Fact]
    public void TryJoinLobby_ShouldReturnTrue_WhenPlayerAlreadyInLobby()
    {
        var engine = CreateEngine();
        var lobby = engine.CreateLobby(CreateHost());

        var player = new Player { Name = "Anna" };

        engine.TryJoinLobby(lobby.Id, player, out _);
        var result = engine.TryJoinLobby(lobby.Id, player, out var error);

        Assert.True(result);
        Assert.Equal(string.Empty, error);
    }

    // Test that a player can set themselves as ready
    [Fact]
    public void SetPlayerReady_ShouldMarkPlayerAsReady()
    {
        var engine = CreateEngine();
        var lobby = engine.CreateLobby(CreateHost());

        var player = new Player { Name = "Anna" };
        engine.TryJoinLobby(lobby.Id, player, out _);

        Assert.False(player.IsReady);

        engine.SetPlayerReady(lobby.Id, player.Id);

        Assert.True(player.IsReady);
    }

    // Test that the game cannot start if only one player is ready
    [Fact]
    public void CanStartGame_ShouldReturnFalse_WhenOnlyOnePlayerReady()
    {
        var engine = CreateEngine();
        var lobby = engine.CreateLobby(CreateHost());

        var p1 = new Player { Name = "A" };
        var p2 = new Player { Name = "B" };

        engine.TryJoinLobby(lobby.Id, p1, out _);
        engine.TryJoinLobby(lobby.Id, p2, out _);

        engine.SetPlayerReady(lobby.Id, p1.Id);

        var result = engine.CanStartGame(lobby.Id);

        Assert.False(result);
    }

    // Test that the game can start when both players are ready
    [Fact]
    public void GetLobby_ShouldReturnNull_WhenLobbyDoesNotExist()
    {
        var engine = CreateEngine();

        var result = engine.GetLobby("invalid");

        Assert.Null(result);
    }

    // Test that a new player has the correct default values
    [Fact]
    public void Player_ShouldInitializeWithDefaults()
    {
        var player = new Player { Name = "Anna" };

        Assert.False(player.IsReady);
        Assert.NotNull(player.Id);
        Assert.True(player.JoinedAt <= DateTime.UtcNow);
    }

    [Fact]
    public void TryJoinLobby_ShouldReturnFalse_WhenInvalidLobbyId()
    {
        var engine = CreateEngine();
        var player = new Player { Name = "Anna" };

        var result = engine.TryJoinLobby("invalid-id", player, out var error);

        Assert.False(result);
        Assert.NotEmpty(error);
    }


  [Fact]
  public void CanStartGame_ShouldReturnTrue_WhenTwoPlayersReady()
  {
    var engine = CreateEngine();
    var host = CreateHost();
    var lobby = engine.CreateLobby(host);

    var player = new Player { Name = "A" };

    engine.TryJoinLobby(lobby.Id, player, out _);

    engine.SetPlayerReady(lobby.Id, host.Id);
    engine.SetPlayerReady(lobby.Id, player.Id);

    var result = engine.CanStartGame(lobby.Id);

    Assert.True(result);
  }


    
    /*
    Next tests :

    POST /api/lobby
    GET /api/lobby/{id}
    POST /api/lobby/{id}/join
    POST /api/lobby/{id}/start
    FATIMA  */
}