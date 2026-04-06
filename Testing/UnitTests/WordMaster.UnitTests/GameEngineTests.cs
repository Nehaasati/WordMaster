using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests;

public class GameEngineTests
{

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

        var lobby = engine.CreateLobby();

        Assert.NotNull(lobby);
        Assert.NotNull(lobby.Id);
        Assert.NotNull(lobby.InviteCode);
    }


    [Fact]
    public void GetLobby_ShouldReturnLobby_WhenExists()
    {
        var engine = CreateEngine();

        var lobby = engine.CreateLobby();

        var result = engine.GetLobby(lobby.Id);

        Assert.NotNull(result);
    }


    [Fact]
    public void GetLobby_ShouldReturnLobby_WhenInviteCodeUsed()
    {
        var engine = CreateEngine();

        var lobby = engine.CreateLobby();

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
        var lobby = engine.CreateLobby();

        var player = new Player { Name = "Anna" };

        var result = engine.TryJoinLobby(lobby.Id, player, out var error);

        Assert.True(result);
        Assert.Single(lobby.Players);
    }

    // Test that a player cannot join a lobby that is already full (2 players)
    [Fact]
    public void TryJoinLobby_ShouldFail_WhenLobbyIsFull()
    {
        var engine = CreateEngine();
        var lobby = engine.CreateLobby();

        var p1 = new Player { Name = "A" };
        var p2 = new Player { Name = "B" };
        var p3 = new Player { Name = "C" };

        engine.TryJoinLobby(lobby.Id, p1, out _);
        engine.TryJoinLobby(lobby.Id, p2, out _);

        var result = engine.TryJoinLobby(lobby.Id, p3, out var error);

        Assert.False(result);
        Assert.Equal("Tyvärr är Lobbyn full och kan inte ta emot fler spelare.", error);
    }

    // Test that a player cannot join a lobby they are already in
    [Fact]
    public void TryJoinLobby_ShouldFail_WhenPlayerAlreadyInLobby()
    {
        var engine = CreateEngine();
        var lobby = engine.CreateLobby();

        var player = new Player { Name = "Anna" };

        engine.TryJoinLobby(lobby.Id, player, out _);
        var result = engine.TryJoinLobby(lobby.Id, player, out var error);

        Assert.False(result);
        Assert.Equal("Player already in lobby", error);
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
    var lobby = engine.CreateLobby();

    var p1 = new Player { Name = "A" };
    var p2 = new Player { Name = "B" };

    engine.TryJoinLobby(lobby.Id, p1, out _);
    engine.TryJoinLobby(lobby.Id, p2, out _);

    engine.SetPlayerReady(lobby.Id, p1.Id);
    engine.SetPlayerReady(lobby.Id, p2.Id);

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