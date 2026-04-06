using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using WordMaster.Models;
using Xunit;

namespace WordMaster.Tests;

/// <summary>
/// Integration tests for the Character API endpoints.
/// Requires: builder.Services.AddControllers() and app.MapControllers() in Program.cs
/// </summary>
public class CharacterControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public CharacterControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // Helper: read body as string for debugging on failure
    private static async Task<string> ReadBody(HttpResponseMessage response)
        => await response.Content.ReadAsStringAsync();

    //  GET /api/character 

    [Fact]
    public async Task GetAll_Returns200()
    {
        var response = await _client.GetAsync("/api/character");

        // If this fails with 404, MapControllers() is missing from Program.cs
        var body = await ReadBody(response);
        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 but got {response.StatusCode}. Body: {body}");
    }

    [Fact]
    public async Task GetAll_ReturnsFourCharacters()
    {
        var response    = await _client.GetAsync("/api/character");
        var body        = await ReadBody(response);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var characters = JsonSerializer.Deserialize<List<JsonElement>>(body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(characters);
        Assert.Equal(4, characters!.Count);
    }

    [Fact]
    public async Task GetAll_ContainsExpectedIds()
    {
        var response = await _client.GetAsync("/api/character");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body       = await ReadBody(response);
        var characters = JsonSerializer.Deserialize<List<JsonElement>>(body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

        var ids = characters.Select(c => c.GetProperty("id").GetString()).ToList();
        Assert.Contains("ugglan",  ids);
        Assert.Contains("leopard", ids);
        Assert.Contains("musen",   ids);
        Assert.Contains("björnen", ids);
    }

    //  GET /api/character/{id} 

    [Theory]
    [InlineData("ugglan")]
    [InlineData("leopard")]
    [InlineData("musen")]
    [InlineData("björnen")]
    public async Task GetById_Returns200_ForValidId(string id)
    {
        var response = await _client.GetAsync($"/api/character/{id}");
        var body     = await ReadBody(response);

        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 for '{id}' but got {response.StatusCode}. Body: {body}");
    }

    [Fact]
    public async Task GetById_Returns404_ForUnknownId()
    {
        var response = await _client.GetAsync("/api/character/dragon");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsCorrectCharacter_ForUgglan()
    {
        var response = await _client.GetAsync("/api/character/ugglan");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await ReadBody(response);
        var json = JsonSerializer.Deserialize<JsonElement>(body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.Equal("ugglan", json.GetProperty("id").GetString());
        Assert.Equal("Ugglan", json.GetProperty("name").GetString());

        var ability = json.GetProperty("ability");
        Assert.Equal(3, ability.GetProperty("bonusPoints").GetInt32());
    }

    //  POST /api/character/ability 

    [Fact]
    public async Task Ability_Returns200_WithBonus3_ForUgglan_LongWord()
    {
        var body     = new { characterId = "ugglan", word = "katastrofal", secondsTaken = 5.0 };
        var response = await _client.PostAsJsonAsync("/api/character/ability", body);
        var raw      = await ReadBody(response);

        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 but got {response.StatusCode}. Body: {raw}");

        var json = JsonSerializer.Deserialize<JsonElement>(raw,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.Equal(3,    json.GetProperty("bonusPoints").GetInt32());
        Assert.True(       json.GetProperty("abilityTriggered").GetBoolean());
    }

    [Fact]
    public async Task Ability_Returns200_WithBonus0_ForUgglan_ShortWord()
    {
        var body     = new { characterId = "ugglan", word = "katt", secondsTaken = 5.0 };
        var response = await _client.PostAsJsonAsync("/api/character/ability", body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var raw  = await ReadBody(response);
        var json = JsonSerializer.Deserialize<JsonElement>(raw,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.Equal(0,     json.GetProperty("bonusPoints").GetInt32());
        Assert.False(       json.GetProperty("abilityTriggered").GetBoolean());
    }

    [Fact]
    public async Task Ability_Returns200_WithBonus3_ForLeopard_FastAnswer()
    {
        var body     = new { characterId = "leopard", word = "katt", secondsTaken = 7.0 };
        var response = await _client.PostAsJsonAsync("/api/character/ability", body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var raw  = await ReadBody(response);
        var json = JsonSerializer.Deserialize<JsonElement>(raw,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.Equal(3, json.GetProperty("bonusPoints").GetInt32());
    }

    [Fact]
    public async Task Ability_Returns200_WithBonus0_ForLeopard_SlowAnswer()
    {
        var body     = new { characterId = "leopard", word = "katt", secondsTaken = 20.0 };
        var response = await _client.PostAsJsonAsync("/api/character/ability", body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var raw  = await ReadBody(response);
        var json = JsonSerializer.Deserialize<JsonElement>(raw,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.Equal(0, json.GetProperty("bonusPoints").GetInt32());
    }

    [Fact]
    public async Task Ability_Returns404_ForUnknownCharacter()
    {
        var body     = new { characterId = "dragon", word = "katt", secondsTaken = 5.0 };
        var response = await _client.PostAsJsonAsync("/api/character/ability", body);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── GET /api/character/{id}/freeze-immune ─────────────────────────────────

    [Fact]
    public async Task FreezeImmune_ReturnsTrue_ForBjörnen()
    {
        var response = await _client.GetAsync("/api/character/björnen/freeze-immune");
        var raw      = await ReadBody(response);

        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 but got {response.StatusCode}. Body: {raw}");

        var json = JsonSerializer.Deserialize<JsonElement>(raw,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.True(json.GetProperty("isFreezeImmune").GetBoolean());
    }

    [Fact]
    public async Task FreezeImmune_ReturnsFalse_ForUgglan()
    {
        var response = await _client.GetAsync("/api/character/ugglan/freeze-immune");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var raw  = await ReadBody(response);
        var json = JsonSerializer.Deserialize<JsonElement>(raw,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.False(json.GetProperty("isFreezeImmune").GetBoolean());
    }

    [Fact]
    public async Task FreezeImmune_Returns404_ForUnknownCharacter()
    {
        var response = await _client.GetAsync("/api/character/dragon/freeze-immune");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}