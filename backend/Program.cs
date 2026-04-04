using WordMaster.Services;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add OpenAPI (Swagger)
builder.Services.AddOpenApi();

// Load dictionary files
var wordDictionary = WordDictionaryLoader.LoadFromFiles
(
    Path.Combine("Data", "SAOL13_117224_Ord.txt"),
    Path.Combine("Data", "SAOL13_AND_14.txt")
);

// Load categories.json
var categoriesJson = File.ReadAllText(Path.Combine("Data", "categories.json"));
var categories = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(categoriesJson)
                ?? new Dictionary<string, List<string>>();

builder.Services.AddSingleton(wordDictionary);
builder.Services.AddSingleton(categories);
builder.Services.AddSingleton<WordValidator>();
builder.Services.AddSingleton<GameEngine>();

// CORS for frontend development (allowing localhost:5173 where Vite dev server runs) — this can be tightened up for production by restricting origins and methods as needed 
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

// MAIN ENDPOINT — WordMaster gameplay 
// This endpoint receives a word submission, validates it using the GameEngine, 
// and returns the result along with the next category and required letter for the frontend to update the UI accordingly.
app.MapPost("/api/game/submit-word", (
    SubmitWordRequest request,
    GameEngine engine) =>
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

// Health check
// This is a simple endpoint to verify that the backend is running and responsive. 
//It can be used by the frontend or monitoring tools to check the health of the application.
app.MapGet("/api/health", () => Results.Ok("OK"));

// Game state endpoint
// This endpoint allows the frontend to retrieve the current game state, including the current category and required letter. 
// It can be used to initialize the game state on the frontend or to refresh it after a word submission.
app.MapGet("/api/game/state", (GameEngine engine) =>
{
    return Results.Ok(new
    {
        currentCategory = engine.CurrentCategory,
        requiredLetter = engine.RequiredLetter
    });
});

// Suggested letters endpoint
app.MapGet("/api/game/suggested-letters",
    (string category, int count, Dictionary<string, List<string>> categories) =>
{
    if (!categories.ContainsKey(category))
    {
        return Results.BadRequest(new { error = "Invalid category" });
    }

    var words = categories[category];
    if (words.Count == 0)
    {
        return Results.BadRequest(new { error = "Category has no words" });
    }

    var rng = new Random();

    // Pick a random word from the category
    var chosenWord = words[rng.Next(words.Count)];
    var requiredLetter = char.ToUpperInvariant(chosenWord[0]);

    // Base letters = letters of the chosen word
    var baseLetters = chosenWord
        .ToUpperInvariant()
        .Where(char.IsLetter)
        .Distinct()
        .ToList();

    // Ensure required letter is included
    if (!baseLetters.Contains(requiredLetter))
        baseLetters.Insert(0, requiredLetter);

    // Add letters from other words in the same category
    foreach (var w in words)
    {
        foreach (var c in w.ToUpperInvariant())
        {
            if (char.IsLetter(c) && !baseLetters.Contains(c))
                baseLetters.Add(c);
        }
    }

    // Add common Swedish letters to increase variety (these can be adjusted based on actual letter frequency in the dictionary)
    // This list can be expanded or modified based on the actual frequency of letters in the SAOL dictionary.
    // The letters are chosen based on general frequency in Swedish language, but can be fine-tuned based on the specific word lists used in the game.
    var common = new[] { 'A','E','S','R','N','T','L','O','I','K','M','U','D','G','H','F','B' };
    foreach (var c in common)
    {
        if (!baseLetters.Contains(c))
            baseLetters.Add(c);
    }

    // Shuffle and take the requested count
    // The shuffle is done using OrderBy with a random key, which is a common technique for shuffling in LINQ.
    var shuffled = baseLetters
        .OrderBy(_ => rng.Next())
        .Take(count)
        .ToList();

    return Results.Ok(new
    {
        requiredLetter = requiredLetter,
        suggestedLetters = shuffled
    });
});


app.Run();

// Request DTO
public record SubmitWordRequest(string Word);