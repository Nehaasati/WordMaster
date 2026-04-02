using WordMaster.Services;

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

if (wordDictionary.Contains("katt"))
{
    Console.WriteLine("Test word found: katt");
}
else
{
    Console.WriteLine("Test word NOT found: katt");
}


//TEMPORARY: TEST WordValidator with a sample word
var validator = new WordValidator();

// Fake dictionary
var dictionary = new HashSet<string>
{
    "fågel", "katt", "hund", "äpple"
};

// Fake categories
var categories = new Dictionary<string, List<string>>
{
    { "Animal", new List<string> { "fågel", "katt", "hund" } },
    { "Food", new List<string> { "äpple" } }
};

// Used words list
var usedWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

// Required letter for this test round
char requiredLetter = 'f';

// Selected category
string category = "Animal";

Console.WriteLine("=== Word Validator Test Console ===");
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
        dictionary: dictionary,
        categories: categories,
        usedWords: usedWords
    );

    Console.WriteLine(result.IsValid
        ? $"✔ VALID: {result.Message}"
        : $"✘ INVALID: {result.Message}");

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