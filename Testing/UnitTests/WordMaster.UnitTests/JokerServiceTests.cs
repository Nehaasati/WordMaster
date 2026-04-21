using WordMaster.Services;

namespace WordMaster.Tests.Services;

public class JokerServiceTests
{
    [Fact]
    public void ActivateJoker_ReturnsActiveJokerForPlayer()
    {
        var service = new JokerService();

        var joker = service.ActivateJoker("LOBBY", "PLAYER");

        Assert.NotNull(joker);
        Assert.False(joker.IsUsed);
        Assert.Equal(joker.JokerLetter, service.GetActiveJoker("LOBBY", "PLAYER")?.JokerLetter);
    }

    [Fact]
    public void ActivateJoker_ReturnsNull_WhenPlayerAlreadyHasActiveJoker()
    {
        var service = new JokerService();

        Assert.NotNull(service.ActivateJoker("LOBBY", "PLAYER"));

        Assert.Null(service.ActivateJoker("LOBBY", "PLAYER"));
    }

    [Fact]
    public void ApplyJoker_ConsumesJokerAndRecordsCategoryMultiplier()
    {
        var service = new JokerService();
        var joker = service.ActivateJoker("LOBBY", "PLAYER");
        Assert.NotNull(joker);

        var multiplier = service.ApplyJoker("LOBBY", "PLAYER", joker.JokerLetter, "Animal");

        Assert.Equal(2, multiplier);
        Assert.Null(service.GetActiveJoker("LOBBY", "PLAYER"));
        Assert.Equal(2, service.GetCategoryMultiplier("LOBBY", "PLAYER", "Animal"));
        Assert.Equal(1, service.GetCategoryMultiplier("LOBBY", "PLAYER", "Food"));
    }

    [Fact]
    public void ApplyJoker_DoesNotConsumeJoker_WhenWordDoesNotContainJokerLetter()
    {
        var service = new JokerService();
        var joker = service.ActivateJoker("LOBBY", "PLAYER");
        Assert.NotNull(joker);

        var word = joker.JokerLetter == "A" ? "ÖÖ" : "AA";
        var multiplier = service.ApplyJoker("LOBBY", "PLAYER", word, "Animal");

        Assert.Equal(1, multiplier);
        Assert.NotNull(service.GetActiveJoker("LOBBY", "PLAYER"));
        Assert.Equal(1, service.GetCategoryMultiplier("LOBBY", "PLAYER", "Animal"));
    }

    [Fact]
    public void ClearLobby_RemovesJokersOnlyForThatLobby()
    {
        var service = new JokerService();

        var clearedLobbyJoker = service.ActivateJoker("LOBBY-1", "PLAYER");
        var otherLobbyJoker = service.ActivateJoker("LOBBY-2", "PLAYER");

        Assert.NotNull(clearedLobbyJoker);
        Assert.NotNull(otherLobbyJoker);

        service.ClearLobby("LOBBY-1");

        Assert.Null(service.GetActiveJoker("LOBBY-1", "PLAYER"));
        Assert.NotNull(service.GetActiveJoker("LOBBY-2", "PLAYER"));
    }
}
