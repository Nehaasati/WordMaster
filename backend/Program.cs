using WordMaster.Services;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

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

app.Run();

public record ValidateRequest(string Word, string Category, List<char> Letters);