using WordMaster.Services;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddControllers();                 // ← ADD servicess 
builder.Services.AddSingleton<CharacterService>();

// Load the word dictionary
var wordDictionary = WordDictionaryLoader.LoadFromFiles
    (
        Path.Combine("Data", "SAOL13_117224_Ord.txt"),
        Path.Combine("Data", "SAOL13_AND_14.txt")
    );

// Load categories
var categoriesJson = File.ReadAllText(Path.Combine("Data", "categories.json"));
var categories = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(categoriesJson)
                ?? new Dictionary<string, List<string>>();

builder.Services.AddSingleton(wordDictionary);
builder.Services.AddSingleton(categories);
builder.Services.AddSingleton<WordValidator>();
builder.Services.AddSingleton<GameEngine>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers(); 
app.MapPost("/api/word/validate", (
    ValidateRequest request, 
    GameEngine engine) =>
{
    var (isValid, message) = engine.ValidateWord(request.Word, request.Category, request.Letters);
    return Results.Ok(new { isValid, message });
});

app.MapPost("/api/lobby", (GameEngine engine) =>
{
    var lobby = engine.CreateLobby();
    return Results.Ok(new { lobbyId = lobby.Id, inviteCode = lobby.InviteCode });
});

app.MapGet("/api/lobby/{lobbyId}", (string lobbyId, GameEngine engine) =>
{
    var lobby = engine.GetLobby(lobbyId);
    return lobby is not null ? Results.Ok(lobby) : Results.NotFound();
});

app.MapGet("/api/game/letters", (GameEngine engine, int count = 15) =>
{
    var letters = engine.GenerateLetters(count);
    return Results.Ok(letters);
});

app.MapGet("/api/health", () => Results.Ok("OK"));

// Endpoint to start the game in a lobby. This checks if the game can be started (enough players) and then notifies all players in the lobby via SignalR.
app.MapPost("/api/lobby/{lobbyId}/start", async (
    string lobbyId,
    GameEngine engine,
    IHubContext<LobbyHub> hub
) =>
{
    // Check if the lobby exists and if the game can be started
    var lobby = engine.GetLobby(lobbyId);

    if (lobby == null)
        return Results.NotFound();

    if (!engine.CanStartGame(lobbyId))
        return Results.BadRequest("Players not ready");

    await hub.Clients.Group(lobbyId)
        .SendAsync("GameStarted", lobbyId);

    return Results.Ok();
});
// New endpoint to join a lobby using either lobby ID or invite code
// This endpoint allows a player to join a lobby and notifies other players in the lobby via SignalR.
app.MapPost("/api/lobby/{lobbyId}/join", async (
    string lobbyId,
    Player player,
    GameEngine engine,
    IHubContext<LobbyHub> hubContext) =>
{
    // assign connection id
    player.ConnectionId = Guid.NewGuid().ToString();

    if (engine.TryJoinLobby(lobbyId, player, out var error))
    {
        await hubContext.Clients.Group(lobbyId)
            .SendAsync("PlayerJoined", player);

        // Log the player joining for debugging purposes
        Console.WriteLine($"Player {player.Name} joined lobby {lobbyId}");

        // Return a success response with the lobby ID and player info
        return Results.Ok(new
        {
            message = "Player joined successfully",
            lobbyId = lobbyId,
            player = player
        });
    }

    // If joining the lobby failed, return a bad request with the error message
    return Results.BadRequest(new { error });
});

// Endpoint to set a player as ready in the lobby. This can be called from the client when a player clicks a "Ready" button, and it notifies other players in the lobby via SignalR.
app.MapPost("/api/lobby/{lobbyId}/ready/{playerId}", async (
    string lobbyId,
    string playerId,
    GameEngine engine,
    IHubContext<LobbyHub> hub
) =>
{
    engine.SetPlayerReady(lobbyId, playerId);

    await hub.Clients.Group(lobbyId)
        .SendAsync("PlayerReady", playerId);

    return Results.Ok();
});

app.MapPost("/api/game/calculate-score", async(
    CalculateScoreRequest request, IHubContext<LobbyHub> hub) =>
{
    var submissions = new Dictionary<string, Dictionary<string, ScoreCalculator.CategorySubmission>>();
    submissions["player"] = new Dictionary<string, ScoreCalculator.CategorySubmission>();
    foreach (var category in request.Categories)
    {
        submissions["player"][category.Id] = new ScoreCalculator.CategorySubmission(category.Word, category.IsValid);
    }
    var scores = ScoreCalculator.CalculateScores(submissions);
    // Check if all answers are valid
    bool allValid = request.Categories.All(c => c.IsValid);

    // Notify the client about the score and whether the match has ended (all answers valid)
    if (allValid)
    {
        await hub.Clients.Group(request.LobbyId)
            .SendAsync("AllAnswersValid", request.PlayerId);

        return Results.Ok(new
        {
            matchEnded = true,
            score = scores["player"]
        });
    }
    // If not all answers are valid, just return the score without ending the match
    await hub.Clients.Group(request.LobbyId)
           .SendAsync("ScoreUpdated", request.PlayerId, scores["player"]);
    // Log the score update for debugging purposes
    Console.WriteLine($"Player {request.PlayerId} scored {scores["player"]} points in lobby {request.LobbyId}");

    // Return the score update response to the client
    return Results.Ok(new { matchEnded = false, score = scores["player"] });
});

// Map the SignalR hub for real-time lobby updates
app.MapHub<LobbyHub>("/lobbyHub");

app.Run();

public record ValidateRequest(string Word, string Category, List<char> Letters);
public record CategorySubmission(string Id, string Word, bool IsValid);
public record CalculateScoreRequest(List<CategorySubmission> Categories, string PlayerId, string LobbyId);
