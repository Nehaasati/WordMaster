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