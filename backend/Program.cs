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
    WordValidator validator, 
    HashSet<string> dictionary, 
    Dictionary<string, List<string>> categoriesList) =>
{
    if (request == null || string.IsNullOrWhiteSpace(request.Word) || string.IsNullOrWhiteSpace(request.Category))
    {
        return Results.Ok(new { isValid = false, message = "Invalid request" });
    }

    if (!validator.IsValidLength(request.Word))
    {
        return Results.Ok(new { isValid = false, message = "Too short" });
    }

    if (!validator.IsValidCharacters(request.Word))
    {
        return Results.Ok(new { isValid = false, message = "Word contains invalid characters" });
    }

    bool inDictionary = validator.IsInDictionary(request.Word, dictionary);
    bool inCategory = validator.IsInCategory(request.Word, request.Category, categoriesList);

    if (!inDictionary || !inCategory)
    {
        return Results.Ok(new { isValid = false, message = "Word not found" });
    }

    return Results.Ok(new { isValid = true, message = "Word found" });
});

app.MapGet("/api/health", () => Results.Ok("OK"));

app.Run();

public record ValidateRequest(string Word, string Category);