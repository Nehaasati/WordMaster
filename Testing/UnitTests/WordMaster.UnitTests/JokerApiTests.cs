using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace WordMaster.Tests;

public class JokerApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public JokerApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ActivateJoker_Costs10PointsAndPersistsSpend()
    {
        var lobby = await CreateLobbyAsync();
        await SyncScoreAsync(lobby, earnedScore: 11);

        var activate = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/joker/{lobby.PlayerId}/activate",
            new { currentScore = 11 });

        activate.EnsureSuccessStatusCode();
        var joker = await activate.Content.ReadFromJsonAsync<JokerActivateResponseDto>();
        Assert.NotNull(joker);
        Assert.Equal(10, joker!.Cost);
        Assert.Equal(1, joker.NewScore);
        Assert.False(string.IsNullOrWhiteSpace(joker.JokerLetter));

        var shopState = await _client.GetFromJsonAsync<ShopApiResponseDto>(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}");

        Assert.NotNull(shopState);
        Assert.Equal(11, shopState!.State.EarnedScore);
        Assert.Equal(10, shopState.State.SpentScore);
        Assert.Equal(1, shopState.State.Balance);
    }

    [Fact]
    public async Task ActivateJoker_ReturnsBadRequest_WhenServerBalanceIsTooLow()
    {
        var lobby = await CreateLobbyAsync();
        await SyncScoreAsync(lobby, earnedScore: 9);

        var activate = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/joker/{lobby.PlayerId}/activate",
            new { currentScore = 99 });

        Assert.Equal(HttpStatusCode.BadRequest, activate.StatusCode);

        var shopState = await _client.GetFromJsonAsync<ShopApiResponseDto>(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}");

        Assert.NotNull(shopState);
        Assert.Equal(9, shopState!.State.Balance);
        Assert.Equal(0, shopState.State.SpentScore);
    }

    private async Task<CreateLobbyDto> CreateLobbyAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/lobby", new { name = "Joker Tester" });
        response.EnsureSuccessStatusCode();

        var lobby = await response.Content.ReadFromJsonAsync<CreateLobbyDto>();
        Assert.NotNull(lobby);

        return lobby!;
    }

    private async Task SyncScoreAsync(CreateLobbyDto lobby, int earnedScore)
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/lobby/{lobby.LobbyId}/shop/{lobby.PlayerId}/sync-score",
            new { earnedScore });

        response.EnsureSuccessStatusCode();
    }

    private sealed record CreateLobbyDto(string LobbyId, string InviteCode, string PlayerId);

    private sealed record JokerActivateResponseDto(string JokerLetter, int Cost, int NewScore, string Message);

    private sealed record ShopApiResponseDto(
        string Message,
        ShopStateDto State,
        object? Item,
        string? PurchasedLetter);

    private sealed record ShopStateDto(
        int Balance,
        int EarnedScore,
        int SpentScore,
        List<char> PurchasedLetters,
        Dictionary<string, int> Powerups,
        List<object> Catalog);
}
