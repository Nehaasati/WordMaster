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

// Create the lobby with the player as the host and return the lobby ID, invite code, and player ID. This endpoint is called when a player creates a new game lobby.
app.MapPost("/api/lobby", (
    string playerName,
    GameEngine engine) =>
{
    var host = new Player
    {
        Name = playerName,
        IsHost = true
    };

    var lobby = engine.CreateLobby(host);

    return Results.Ok(new
    {
        lobbyId = lobby.Id,
        inviteCode = lobby.InviteCode,
        playerId = host.Id
    });
});

app.MapGet("/api/lobby/{lobbyId}", (string lobbyId, GameEngine engine) =>
{
    var lobby = engine.GetLobby(lobbyId);
    return lobby is not null ? Results.Ok(lobby) : Results.NotFound();
});

app.MapGet("/api/game/letters", (GameEngine engine, int count = 25) =>
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

    // Start the game in the engine in order to set the lobby state, initialize rounds, etc.
    if (!engine.StartGame(lobbyId))
        return Results.BadRequest("Failed to start game");

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

// Endpoint for players to submit their words for the current round. This marks the player as having submitted, and if all players have submitted, it triggers the end of the round in the game engine.
app.MapPost("/api/game/submit/{lobbyId}/{playerId}", (
    string lobbyId,
    string playerId,
    GameEngine engine) =>
{
    var success = engine.SubmitRound(lobbyId, playerId);

    if (!success)
    {
        return Results.BadRequest(new { message = "Submission failed" });
    }

    return Results.Ok(new { submitted = true });
});

// Endpoint to check if the round time is over. If it is, it ends the round in the game engine and returns a response indicating that the round has ended.
app.MapGet("/api/game/round-status/{lobbyId}", (
    string lobbyId,
    GameEngine engine) =>
{
    var lobby = engine.GetLobby(lobbyId);

    if (lobby == null)
        return Results.NotFound();

    if (engine.IsRoundTimeOver(lobbyId))
    {
        engine.EndRound(lobbyId);
    }

    // Calculate remaining time for the round
    var remainingTime =
        lobby.RoundDurationSeconds -
        (int)(DateTime.UtcNow - lobby.RoundStartTime).TotalSeconds;

    if (remainingTime < 0)
        remainingTime = 0;

    return Results.Ok(new RoundStatusResponse(
        lobby.CurrentRound,
        lobby.State.ToString(),
        remainingTime,
        lobby.Players.Count(p => p.HasSubmitted),
        lobby.Players.Count
    ));
});

// Endpoint to start the next round in the lobby.
app.MapPost("/api/game/next-round/{lobbyId}", (
    string lobbyId,
    GameEngine engine) =>
{
    var lobby = engine.GetLobby(lobbyId);

    if (lobby == null)
        return Results.NotFound();

    if (lobby.State != GameState.RoundFinished)
        return Results.BadRequest("Round not finished yet");

    engine.StartNextRound(lobbyId);

    return Results.Ok(new
    {
        round = lobby.CurrentRound,
        state = lobby.State.ToString(),
        letters = lobby.Letters
    });
});

//Finish the game for a player. This is called when a player finishes submitting their words for the final round, and it checks if the match has ended (all players finished). If the match has ended, it notifies all players in the lobby via SignalR.
app.MapPost("/api/game/finish/{lobbyId}/{playerId}", async (
    string lobbyId,
    string playerId,
    GameEngine engine,
    IHubContext<LobbyHub> hub
) =>
{
    // Mark the player as finished in the game engine
    bool matchEnded = engine.PlayerFinished(lobbyId, playerId);

    if (matchEnded)
    {
        // Notify all players in the lobby that the match has ended
        await hub.Clients.Group(lobbyId)
            .SendAsync("MatchEnded", lobbyId);

        return Results.Ok(new { finished = true, matchEnded = true });
    }

    return Results.Ok(new { finished = true, matchEnded = false });
});

app.MapPost("/api/game/calculate-score", (
    CalculateScoreRequest request) =>
{
    var submissions = new Dictionary<string, Dictionary<string, ScoreCalculator.CategorySubmission>>();
    submissions["player"] = new Dictionary<string, ScoreCalculator.CategorySubmission>();
    foreach (var category in request.Categories)
    {
        submissions["player"][category.Id] = new ScoreCalculator.CategorySubmission(category.Word, category.IsValid);
    }
    var scores = ScoreCalculator.CalculateScores(submissions);
    return Results.Ok(new { score = scores["player"] });
});

// Map the SignalR hub for real-time lobby updates
app.MapHub<LobbyHub>("/lobbyHub");

app.Run();

public record ValidateRequest(string Word, string Category, List<char> Letters);
public record CategorySubmission(string Id, string Word, bool IsValid);
public record CalculateScoreRequest(List<CategorySubmission> Categories);

// Response model for round status, indicating the current round, game state, remaining time, and player submission status.
public record RoundStatusResponse(
    int CurrentRound,
    string GameState,
    int RemainingTime,
    int PlayersSubmitted,
    int TotalPlayers
);