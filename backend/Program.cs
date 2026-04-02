using WordMaster.Services;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// Load the word dictionary and register it as a singleton service
var wordDictionary = WordDictionaryLoader.LoadFromFiles
    (
        Path.Combine("Data", "SAOL13_117224_Ord.txt"),
        Path.Combine("Data", "SAOL13_AND_14.txt")
    );

// temporary test to print the number of words loaded
Console.WriteLine($"Loaded words: {wordDictionary.Count}");

// Load categories.json
var categoriesJson = File.ReadAllText(Path.Combine("Data", "categories.json"));
var categories = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(categoriesJson)
                ?? new Dictionary<string, List<string>>();

var validator = new WordValidator();

// Used words list
var usedWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

// Choose category
Console.WriteLine("Available categories:");
foreach (var cat in categories.Keys)
    Console.WriteLine($"- {cat}");

Console.Write("\nChoose a category: ");
string category = Console.ReadLine() ?? "Animal";

// Choose required letter
Console.Write("Enter required starting letter: ");
char requiredLetter = Console.ReadKey().KeyChar;
Console.WriteLine();

Console.WriteLine("\n=== Word Validator Test Console ===");
Console.WriteLine($"Category: {category}");
Console.WriteLine($"Required starting letter: {requiredLetter}");
Console.WriteLine("Type 'exit' to quit.");
Console.WriteLine("-----------------------------------");

while (true)
{
    Console.Write("\nEnter a word: ");
    string? input = Console.ReadLine();

    if (input == null)
        continue;

    if (input.Equals("exit", StringComparison.OrdinalIgnoreCase))
        break;

    var result = validator.ValidateWord(
        word: input,
        category: category,
        requiredLetter: requiredLetter,
        dictionary: wordDictionary,   // the full real word dictionary loaded from the text files
        categories: categories,       // the category definitions loaded from categories.json
        usedWords: usedWords
    );

    Console.WriteLine(result.IsValid
        ? $"VALID: {result.Message}"
        : $"INVALID: {result.Message}");

    if (result.IsValid)
    {
        usedWords.Add(input.ToLower());
        Console.WriteLine($"Added '{input}' to used words.");
    }
}

// Register the word dictionary as a singleton service
builder.Services.AddSingleton(wordDictionary);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();