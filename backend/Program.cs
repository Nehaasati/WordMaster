using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using WordMaster.Services;

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
builder.Services.AddSingleton<ClassicGameEngine>();
builder.Services.AddSingleton<JokerService>();

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

// The backend root
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapFallbackToFile("index.html");

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers(); 
app.MapPost("/api/word/validate", (
    ValidateRequest request,
    GameEngine engine,
    JokerService jokerService) =>
{
    bool useJokerWildcard = false;
    if (!string.IsNullOrWhiteSpace(request.LobbyId) && !string.IsNullOrWhiteSpace(request.PlayerId))
    {
        var joker = jokerService.GetActiveJoker(request.LobbyId, request.PlayerId);
        useJokerWildcard = joker is not null && request.UseJokerWildcard;
    }

    var (isValid, message) = engine.ValidateWord(request.Word, request.Category, request.Letters, useJokerWildcard);
    return Results.Ok(new { isValid, message });
});

// Create the lobby with the player as the host and return the lobby ID, invite code, and player ID. This endpoint is called when a player creates a new game lobby.
app.MapPost("/api/lobby", (
    CreateLobbyRequest request,
    GameEngine engine) =>
{
    var host = new Player
    {
        Name = request.Name,
        IsHost = true
    };

    var lobby = engine.CreateLobby(host);

    // Log the player creating for debugging purposes
    Console.WriteLine($"{host.Name} created lobby {lobby.Id}");
    
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

// ── Classic (solo) game endpoints ──────────────────────────────────────────

app.MapGet("/api/classic/game/state", (ClassicGameEngine engine) =>
    Results.Ok(new
    {
        currentCategory = engine.CurrentCategory,
        requiredLetter = engine.RequiredLetter
    }));

app.MapPost("/api/classic/game/submit-word", (
    SubmitWordRequest request,
    ClassicGameEngine engine) =>
{
    var (isValid, message) = engine.SubmitWord(request.Word);
    return Results.Ok(new
    {
        isValid,
        message,
        nextCategory = engine.CurrentCategory,
        requiredLetter = engine.RequiredLetter
    });
});

app.MapGet("/api/classic/game/suggested-letters",
    (string category, int count, ClassicGameEngine engine, Dictionary<string, List<string>> categories) =>
{
    if (!categories.ContainsKey(category))
        return Results.BadRequest(new { error = "Invalid category" });

    var words = categories[category];
    if (words.Count == 0)
        return Results.BadRequest(new { error = "Category has no words" });

    var requiredLetter = engine.RequiredLetter;

    // Only use words that start with the required letter so the pool always
    // contains enough letters to spell at least one valid word.
    var validWords = words
        .Where(w => char.ToUpperInvariant(w[0]) == requiredLetter)
        .ToList();

    if (validWords.Count == 0)
        validWords = words; // fallback (shouldn't happen with new engine logic)

    var rng = new Random();
    var chosenWord = validWords[rng.Next(validWords.Count)];
    var chosenWordUpper = chosenWord.ToUpperInvariant();

    // Guaranteed: every letter needed to spell the chosen word (with duplicates).
    // These are ALWAYS included so the player can always type the answer.
    var guaranteed = chosenWordUpper.Where(char.IsLetter).ToList();

    // Extras pool: letters from other valid words + common Swedish letters for variety.
    var extrasPool = new List<char>();
    foreach (var w in validWords)
        foreach (var c in w.ToUpperInvariant())
            if (char.IsLetter(c)) extrasPool.Add(c);

    var common = new[] { 'A','E','S','R','N','T','L','O','I','K','M','U','D','G','H','F','B' };
    foreach (var c in common) extrasPool.Add(c);

    // Shuffle extras and pad up to the requested count.
    var padding = extrasPool
        .OrderBy(_ => rng.Next())
        .Take(Math.Max(0, count - guaranteed.Count))
        .ToList();

    // Combine guaranteed letters with padding, then shuffle the whole set.
    var finalLetters = guaranteed.Concat(padding).OrderBy(_ => rng.Next()).ToList();

    return Results.Ok(new { requiredLetter, suggestedLetters = finalLetters, targetWord = chosenWordUpper });
});

app.MapPost("/api/classic/game/skip", (ClassicGameEngine engine) =>
{
    engine.AdvanceToNextCategory();
    return Results.Ok(new
    {
        currentCategory = engine.CurrentCategory,
        requiredLetter = engine.RequiredLetter
    });
});

// Endpoint to start the game in a lobby. This checks if the game can be started (enough players) and then notifies all players in the lobby via SignalR.
app.MapPost("/api/lobby/{lobbyId}/start", async (
    string lobbyId,
    StartGameRequest? request,
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

    var gameMode = request?.GameMode ?? "standard";

    await hub.Clients.Group(lobbyId)
        .SendAsync("GameStarted", lobbyId, gameMode);

    return Results.Ok();
});

// New endpoint to join a lobby using either lobby ID or invite code
// This endpoint allows a player to join a lobby and notifies other players in the lobby via SignalR. and choose character
app.MapPost("/api/lobby/{lobbyId}/join", async (
    string lobbyId,
    JoinRequest request,
    GameEngine engine,
    IHubContext<LobbyHub> hubContext) =>
{
    var player = new Player
    {
        Name = request.Name,
        IsHost = request.IsHost,
        CharacterId = request.CharacterId,   // ← now stored
        ConnectionId = Guid.NewGuid().ToString()
    };
        // assign connection id
    //player.ConnectionId = Guid.NewGuid().ToString();
    if (player == null || string.IsNullOrEmpty(player.Name))
        return Results.BadRequest("Invalid player");

    if (engine.TryJoinLobby(lobbyId, player, out var error))
    {
        // Add the player's connection to the SignalR group for the lobby so they can receive real-time updates about the lobby
        //await hubContext.Groups.AddToGroupAsync(player.ConnectionId, lobbyId);

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

    // log ready
    Console.WriteLine($"Player {playerId} is ready in lobby {lobbyId}");

    await hub.Clients.Group(lobbyId)
        .SendAsync("PlayerReady", playerId);

    return Results.Ok();
});

// Endpoint to start the game in a lobby. This checks if the game can be started (enough players) and then notifies all players in the lobby via SignalR.
app.MapPost("/api/lobby/{lobbyId}/start/{playerId}", async (
    string lobbyId,
    string playerId,
    GameEngine engine,
    IHubContext<LobbyHub> hub
) =>
{
    // Check if the lobby exists and if the game can be started
    var lobby = engine.GetLobby(lobbyId);

    if (lobby == null)
        return Results.NotFound();

    var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
    if (player == null)
        return Results.BadRequest("Invalid player");

    if (!player.IsHost)
        return Results.BadRequest("Only host can start the game");

    // Start the game in the engine in order to set the lobby state, initialize rounds.
    if (!engine.CanStartGame(lobbyId))
        return Results.BadRequest("Players not ready");

    if (!engine.StartGame(lobbyId, playerId))
        return Results.BadRequest("Failed to start game");

    await hub.Clients.Group(lobbyId)
        .SendAsync("GameStarted", lobbyId);

    return Results.Ok();
});

//Finish the game for a player. This is called when a player finishes submitting their words for the final round, and it checks if the match has ended (all players finished). If the match has ended, it notifies all players in the lobby via SignalR.
app.MapPost("/api/lobby/{lobbyId}/player-finished/{playerId}", async (
    string lobbyId,
    string playerId,
    FinishRequest request,
    GameEngine engine,
    IHubContext<LobbyHub> hub
) =>
{
    var lobby = engine.GetLobby(lobbyId);
    var player = lobby?.Players.FirstOrDefault(p => p.Id == playerId);

    if (player != null)
    {
        player.CategoriesCompleted = request.CategoriesCompleted;
        player.Score = request.Score;
    }
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
app.MapPost("/api/lobby/{lobbyId}/save-score/{playerId}", (
    string lobbyId,
    string playerId,
    SaveScoreRequest request,
    GameEngine engine
) =>
{
    var lobby = engine.GetLobby(lobbyId);
    var player = lobby?.Players.FirstOrDefault(p => p.Id == playerId);
    if (player == null) return Results.NotFound();
    player.Score = request.Score;
    return Results.Ok(new { saved = true });
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

app.MapPost("/api/lobby/{lobbyId}/add-bot", async (
    string lobbyId,
    GameEngine engine,
    IHubContext<LobbyHub> hub) =>
{
    var bot = engine.AddBot(lobbyId);
    if (bot == null)
        return Results.BadRequest(new { error = "Cannot add bot to this lobby" });

    await hub.Clients.Group(lobbyId).SendAsync("PlayerJoined", bot);
    await hub.Clients.Group(lobbyId).SendAsync("PlayerReady", bot.Id);

    return Results.Ok(new { bot });
});

app.MapGet("/api/bot/word", (string category, Dictionary<string, List<string>> categories) =>
{
    if (!categories.TryGetValue(category, out var words) || words.Count == 0)
        return Results.NotFound();

    var rng = new Random();
    var word = words[rng.Next(words.Count)];
    return Results.Ok(new { word = word.ToUpper() });
});

// An endpoint to allow players to start a new round/game on the same lobby 
app.MapPost("/api/lobby/{lobbyId}/restart", async (
    string lobbyId,
    string playerId,
    GameEngine engine,
    IHubContext<LobbyHub> hub
) =>
{
    var lobby = engine.GetLobby(lobbyId);
    if (lobby == null)
        return Results.NotFound();

    var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
    if (player == null)
        return Results.BadRequest("Invalid player");

    if (!player.IsHost)
        return Results.BadRequest("Only host can restart");

    if (!lobby.MatchEnded)
        return Results.BadRequest("Game not finished yet");

    engine.ResetLobbyForNewRound(lobbyId);

    await hub.Clients.Group(lobbyId)
        .SendAsync("LobbyReset", lobbyId);

    return Results.Ok(new { message = "Lobby reset for new round" });
});

// An endpoint to allow new player to join the lobby if one if the lobby's previouse players has left
app.MapPost("/api/lobby/{lobbyId}/leave/{playerId}", async (
    string lobbyId,
    string playerId,
    GameEngine engine,
    IHubContext<LobbyHub> hub
) =>
{
    var success = engine.RemovePlayer(lobbyId, playerId, out var hostChanged);

    if (!success)
        return Results.NotFound();

    await hub.Clients.Group(lobbyId)
        .SendAsync("PlayerLeft", playerId);

    if (hostChanged)
    {
        var lobby = engine.GetLobby(lobbyId);
        var newHost = lobby?.Players.FirstOrDefault(p => p.IsHost);

        if (newHost != null)
        {
            await hub.Clients.Group(lobbyId)
                .SendAsync("HostChanged", newHost.Id);
        }
    }

    return Results.Ok(new
    {
        message = "Player left lobby",
        hostChanged
    });
});
 
 
// POST /api/lobby/{lobbyId}/joker/{playerId}/activate
// Activates a Joker Card for a player. Costs 10 points.
// Returns the gold letter assigned as the joker.
app.MapPost("/api/lobby/{lobbyId}/joker/{playerId}/activate", (
    string lobbyId,
    string playerId,
    JokerActivateRequest request,
    JokerService jokerService,
    GameEngine engine) =>
{
    var lobby = engine.GetLobby(lobbyId);
    if (lobby == null)
        return Results.NotFound(new { error = "Lobby not found" });
 
    var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });
 
    // Cost: 10 points (check against frontend score)
    const int cost = 10;
    if (request.CurrentScore < cost)
        return Results.BadRequest(new { error = "Not enough points. Joker costs 10 points." });
 
    var joker = jokerService.ActivateJoker(lobbyId, playerId);
    if (joker == null)
        return Results.BadRequest(new { error = "You already have an active Joker." });
 
    // Update player score (deduct cost)
    player.Score = request.CurrentScore - cost;
 
    Console.WriteLine($"Player {player.Name} activated Joker: {joker.JokerLetter} | New Score: {player.Score}");
 
    return Results.Ok(new
    {
        jokerLetter = joker.JokerLetter,
        cost        = cost,
        newScore    = player.Score,
        message     = $"Bokstaven {joker.JokerLetter} är nu din Joker! Ord med denna bokstav ger dubbla poäng."
    });
});
 
 
// GET /api/lobby/{lobbyId}/joker/{playerId}
// Returns the current active joker for a player (or null if none).
app.MapGet("/api/lobby/{lobbyId}/joker/{playerId}", (
    string lobbyId,
    string playerId,
    JokerService jokerService) =>
{
    var joker = jokerService.GetActiveJoker(lobbyId, playerId);
    if (joker == null)
        return Results.Ok(new { hasJoker = false, jokerLetter = (string?)null });
 
    return Results.Ok(new
    {
        hasJoker    = true,
        jokerLetter = joker.JokerLetter,
        isUsed      = joker.IsUsed
    });
});
 
 
// POST /api/lobby/{lobbyId}/joker/{playerId}/apply
// Called after a word is validated as correct.
// Returns the score multiplier (1 = no bonus, 2 = double).
app.MapPost("/api/lobby/{lobbyId}/joker/{playerId}/apply", (
    string lobbyId,
    string playerId,
    ApplyJokerRequest request,
    JokerService jokerService) =>
{
    var multiplier = jokerService.ApplyJoker(lobbyId, playerId, request.Word, request.UsedWildcard);
        word          = request.Word,
        message       = triggered
            ? $"🃏 JOKER! Dubbla poäng för \"{request.Word}\"!"
            : "No joker bonus."
    });
});

// Map the SignalR hub for real-time lobby updates
app.MapHub<LobbyHub>("/lobbyHub");

app.Run();

public record ApplyJokerRequest(string Word, bool UsedWildcard);
public record JokerActivateRequest(int CurrentScore);
public record ValidateRequest(string Word, string Category, List<char> Letters, string? LobbyId = null, string? PlayerId = null, bool UseJokerWildcard = false);
public record SubmitWordRequest(string Word);
public record StartGameRequest(string GameMode);
public record CategorySubmission(string Id, string Word, bool IsValid);
public record CalculateScoreRequest(List<CategorySubmission> Categories);
public record CreateLobbyRequest(string Name);
public record FinishRequest(bool CategoriesCompleted, int Score = 0);
public record SaveScoreRequest(int Score); 

// join this character with backend with thier ability
public class JoinRequest
{
    public string Name        { get; set; } = "";
    public bool   IsHost      { get; set; }
    public string CharacterId { get; set; } = "";
}

// Response model for round status, indicating the current round, game state, remaining time, and player submission status.
public record RoundStatusResponse(
    int CurrentRound,
    string GameState,
    int RemainingTime,
    int PlayersSubmitted,
    int TotalPlayers
);