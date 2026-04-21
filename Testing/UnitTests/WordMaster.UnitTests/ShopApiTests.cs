using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace WordMaster.Tests;

public class ShopApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ShopApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PurchaseLetter_RequiresSyncedScoreAndPersistsState()
    {
        var lobby = await CreateLobbyAsync();

        var rejectedPurchase = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}/purchase",
            new { itemId = "A" });

        Assert.Equal(HttpStatusCode.Conflict, rejectedPurchase.StatusCode);

        var synced = await SyncScoreAsync(lobby, earnedScore: 10);
        Assert.Equal(10, synced.State.Balance);

        var purchase = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}/purchase",
            new { itemId = "A" });

        purchase.EnsureSuccessStatusCode();
        var purchaseBody = await ReadShopResponseAsync(purchase);

        Assert.Equal("A", purchaseBody.PurchasedLetter);
        Assert.Equal(5, purchaseBody.State.Balance);
        Assert.Equal(5, purchaseBody.State.SpentScore);
        Assert.Equal(new[] { 'A' }, purchaseBody.State.PurchasedLetters);

        var state = await _client.GetFromJsonAsync<ShopApiResponseDto>(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}");

        Assert.NotNull(state);
        Assert.Equal(5, state!.State.Balance);
        Assert.Equal(new[] { 'A' }, state.State.PurchasedLetters);
    }

    [Fact]
    public async Task ConsumePowerup_RequiresPurchasedInventoryAndRemovesIt()
    {
        var lobby = await CreateLobbyAsync();
        await SyncScoreAsync(lobby, earnedScore: 10);

        var purchase = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}/purchase",
            new { itemId = "freeze" });

        purchase.EnsureSuccessStatusCode();
        var purchaseBody = await ReadShopResponseAsync(purchase);
        Assert.Equal(1, purchaseBody.State.Powerups["freeze"]);

        var consume = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}/consume-powerup",
            new { powerupId = "freeze" });

        consume.EnsureSuccessStatusCode();
        var consumeBody = await ReadShopResponseAsync(consume);
        Assert.DoesNotContain("freeze", consumeBody.State.Powerups.Keys);

        var secondConsume = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}/consume-powerup",
            new { powerupId = "freeze" });

        Assert.Equal(HttpStatusCode.Conflict, secondConsume.StatusCode);
    }

    [Fact]
    public async Task InvalidShopItem_ReturnsBadRequestWithoutChangingBalance()
    {
        var lobby = await CreateLobbyAsync();
        await SyncScoreAsync(lobby, earnedScore: 10);

        var invalidPurchase = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}/purchase",
            new { itemId = "dragon" });

        Assert.Equal(HttpStatusCode.BadRequest, invalidPurchase.StatusCode);

        var state = await _client.GetFromJsonAsync<ShopApiResponseDto>(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}");

        Assert.NotNull(state);
        Assert.Equal(10, state!.State.Balance);
        Assert.Equal(0, state.State.SpentScore);
        Assert.Empty(state.State.PurchasedLetters);
        Assert.Empty(state.State.Powerups);
    }

    private async Task<CreateLobbyDto> CreateLobbyAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/lobby", new { name = "Shop Tester" });
        response.EnsureSuccessStatusCode();

        var lobby = await response.Content.ReadFromJsonAsync<CreateLobbyDto>();
        Assert.NotNull(lobby);

        return lobby!;
    }

    private async Task<ShopApiResponseDto> SyncScoreAsync(CreateLobbyDto lobby, int earnedScore)
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}/sync-score",
            new { earnedScore });

        response.EnsureSuccessStatusCode();
        return await ReadShopResponseAsync(response);
    }

    private static async Task<ShopApiResponseDto> ReadShopResponseAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<ShopApiResponseDto>();
        Assert.NotNull(body);
        return body!;
    }

    private sealed record CreateLobbyDto(string LobbyId, string InviteCode, string PlayerId);

    private sealed record ShopApiResponseDto(
        string Message,
        ShopStateDto State,
        ShopCatalogItemDto? Item,
        string? PurchasedLetter);

    private sealed record ShopStateDto(
        int Balance,
        int EarnedScore,
        int SpentScore,
        List<char> PurchasedLetters,
        Dictionary<string, int> Powerups,
        List<ShopCatalogItemDto> Catalog);

    private sealed record ShopCatalogItemDto(string Id, string Label, string Type, int Cost);
}
