using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests;

public class GameEngineShopTests
{
    private static GameEngine CreateEngine()
    {
        var validator = new WordValidator();
        var dictionary = new HashSet<string> { "APPLE", "DOG", "CAT" };
        var categories = new Dictionary<string, List<string>>
        {
            { "Animal", new List<string> { "DOG", "CAT" } },
            { "Food", new List<string> { "APPLE" } }
        };

        return new GameEngine(validator, dictionary, categories);
    }

    private static (GameEngine Engine, Lobby Lobby, Player Host, Player Guest) CreateLobbyWithTwoPlayers()
    {
        var engine = CreateEngine();
        var host = new Player { Name = "Host" };
        var lobby = engine.CreateLobby(host);
        var guest = new Player { Name = "Guest" };

        var joined = engine.TryJoinLobby(lobby.Id, guest, out var error);

        Assert.True(joined, error);
        return (engine, lobby, host, guest);
    }

    [Fact]
    public void PurchaseLetter_DeductsBalanceAndStoresLetterForOnlyTheBuyer()
    {
        var (engine, lobby, host, guest) = CreateLobbyWithTwoPlayers();

        engine.SyncShopScore(lobby.Id, host.Id, earnedScore: 10);

        var purchase = engine.PurchaseShopItem(lobby.Id, host.Id, "Ä");
        var guestState = engine.GetShopState(lobby.Id, guest.Id);

        Assert.True(purchase.Succeeded, purchase.Message);
        Assert.Equal(5, purchase.State!.Balance);
        Assert.Equal(5, purchase.State.SpentScore);
        Assert.Equal(new[] { 'Ä' }, purchase.State.PurchasedLetters);
        Assert.Empty(guestState.State!.PurchasedLetters);
        Assert.Equal(0, guestState.State.Balance);
    }

    [Fact]
    public void PurchasePowerup_RejectsDuplicateUntilThePowerupIsConsumed()
    {
        var (engine, lobby, host, _) = CreateLobbyWithTwoPlayers();

        engine.SyncShopScore(lobby.Id, host.Id, earnedScore: 15);

        var firstPurchase = engine.PurchaseShopItem(lobby.Id, host.Id, "freeze");
        var duplicatePurchase = engine.PurchaseShopItem(lobby.Id, host.Id, "freeze");
        var consume = engine.ConsumePowerup(lobby.Id, host.Id, "freeze");
        var secondPurchase = engine.PurchaseShopItem(lobby.Id, host.Id, "freeze");

        Assert.True(firstPurchase.Succeeded, firstPurchase.Message);
        Assert.Equal(1, firstPurchase.State!.Powerups["freeze"]);
        Assert.False(duplicatePurchase.Succeeded);
        Assert.Equal(ShopOperationStatus.AlreadyOwned, duplicatePurchase.Status);
        Assert.True(consume.Succeeded, consume.Message);
        Assert.DoesNotContain("freeze", consume.State!.Powerups.Keys);
        Assert.True(secondPurchase.Succeeded, secondPurchase.Message);
        Assert.Equal(5, secondPurchase.State!.Balance);
        Assert.Equal(1, secondPurchase.State.Powerups["freeze"]);
    }

    [Fact]
    public void PurchaseShopItem_ReturnsNotEnoughScore_WhenBalanceIsTooLow()
    {
        var (engine, lobby, host, _) = CreateLobbyWithTwoPlayers();

        var purchase = engine.PurchaseShopItem(lobby.Id, host.Id, "A");
        var state = engine.GetShopState(lobby.Id, host.Id);

        Assert.False(purchase.Succeeded);
        Assert.Equal(ShopOperationStatus.NotEnoughScore, purchase.Status);
        Assert.Equal(0, state.State!.SpentScore);
        Assert.Empty(state.State.PurchasedLetters);
    }

    [Fact]
    public void SyncShopScore_RecalculatesBalanceAgainstExistingSpend()
    {
        var (engine, lobby, host, _) = CreateLobbyWithTwoPlayers();

        engine.SyncShopScore(lobby.Id, host.Id, earnedScore: 10);
        engine.PurchaseShopItem(lobby.Id, host.Id, "A");

        var increasedScore = engine.SyncShopScore(lobby.Id, host.Id, earnedScore: 12);
        var reducedScore = engine.SyncShopScore(lobby.Id, host.Id, earnedScore: 3);

        Assert.Equal(7, increasedScore.State!.Balance);
        Assert.Equal(0, reducedScore.State!.Balance);
        Assert.Equal(5, reducedScore.State.SpentScore);
    }

    [Fact]
    public void ResetLobbyForNewRound_ClearsShopStateForEveryPlayer()
    {
        var (engine, lobby, host, guest) = CreateLobbyWithTwoPlayers();

        engine.SyncShopScore(lobby.Id, host.Id, earnedScore: 10);
        engine.SyncShopScore(lobby.Id, guest.Id, earnedScore: 10);
        engine.PurchaseShopItem(lobby.Id, host.Id, "A");
        engine.PurchaseShopItem(lobby.Id, guest.Id, "freeze");

        var reset = engine.ResetLobbyForNewRound(lobby.Id);
        var hostState = engine.GetShopState(lobby.Id, host.Id);
        var guestState = engine.GetShopState(lobby.Id, guest.Id);

        Assert.True(reset);
        Assert.Equal(0, hostState.State!.Balance);
        Assert.Equal(0, guestState.State!.Balance);
        Assert.Empty(hostState.State.PurchasedLetters);
        Assert.Empty(guestState.State.Powerups);
    }
}
