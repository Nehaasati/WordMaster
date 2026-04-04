using WordMaster.Services;

namespace WordMaster.Services;

public class GameEngine
{
    private readonly WordValidator _validator;
    private readonly HashSet<string> _dictionary;
    private readonly Dictionary<string, List<string>> _categories;

    // Random generator for letter selection (weighted)
    private static readonly Random _random = new Random();

    private readonly List<string> _categoryList;
    private int _currentCategoryIndex = 0;

    private static readonly string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";

    // Weighted randomizer (matching frontend logic)
    private static readonly Dictionary<char, int> Weights = new()
    {
        { 'A', 5 }, { 'E', 5 }, { 'I', 5 }, { 'O', 5 }, { 'U', 5 }, { 'Y', 5 },
        { 'Å', 2 }, { 'Ä', 2 }, { 'Ö', 2 },
        { 'B', 3 }, { 'C', 1 }, { 'D', 3 }, { 'F', 2 }, { 'G', 3 }, { 'H', 3 },
        { 'J', 2 }, { 'K', 4 }, { 'L', 4 }, { 'M', 4 }, { 'N', 4 }, { 'P', 3 },
        { 'R', 5 }, { 'S', 5 }, { 'T', 5 }, { 'V', 3 }, { 'W', 1 }, { 'X', 1 }, { 'Z', 1 }
    };

    public HashSet<string> UsedWords { get; } = new(StringComparer.OrdinalIgnoreCase);

    public string CurrentCategory => _categoryList[_currentCategoryIndex];
    public char RequiredLetter { get; private set; }

    public GameEngine(
        WordValidator validator,
        HashSet<string> dictionary,
        Dictionary<string, List<string>> categories)
    {
        _validator = validator;
        _dictionary = dictionary;
        _categories = categories;

        _categoryList = _categories.Keys.ToList();
        if (_categoryList.Count == 0)
            throw new InvalidOperationException("No categories loaded.");

        GenerateRequiredLetter();
    }

    // Issue #16 — Auto advance to next category after valid submission (handled in SubmitWord method)
    public void AdvanceToNextCategory()
    {
        _currentCategoryIndex++;

        // If all categories are completed
        if (_currentCategoryIndex >= _categoryList.Count)
        {
             _currentCategoryIndex = 0;

             // Generate new letter ONLY after finishing all categories
            GenerateRequiredLetter();
        }
    }

    // Weighted Random Letter Generator (matching frontend logic)
    private void GenerateRequiredLetter()
    {
        var weightedPool = new List<char>();

        foreach (var c in Alphabet)
        {
            int weight = Weights.TryGetValue(c, out int w) ? w : 2;

            for (int i = 0; i < weight; i++)
            weightedPool.Add(c);
        }

        RequiredLetter = weightedPool[_random.Next(weightedPool.Count)];
    }

    // Issue #15 — Word submission and validation
    public (bool IsValid, string Message) SubmitWord(string word)
    {
        // Basic validations 
        if (string.IsNullOrWhiteSpace(word))
            return (false, "Invalid request");

        // Trim and normalize the word to uppercase for consistent validation
        word = word.Trim().ToUpperInvariant();

        // Normalize the word to uppercase for consistent validation

        if (!_validator.IsValidLength(word))
            return (false, "Too short");

        // Check for invalid characters before normalizing to uppercase

        if (!_validator.IsValidCharacters(word))
            return (false, "Word contains invalid characters");

        // Normalize the word to uppercase for consistent validation

        if (!_validator.StartsWithCorrectLetter(word, RequiredLetter))
            return (false, "Word does not start with required letter");

        // Check if the word has been used before (case-insensitive)

        if (!_validator.IsNotUsedBefore(word, UsedWords))
            return (false, "Word already used");

        // Check if the word is in the dictionary (case-insensitive)

        if (!_validator.IsInDictionary(word, _dictionary))
            return (false, "Word not found in dictionary");
            
        // Check if the word belongs to the current category (case-insensitive)

        if (!_validator.IsInCategory(word, CurrentCategory, _categories))
            return (false, "Word not found in category");

        // If we reach here, the word is valid and we can add it to the used words and advance to the next category (handled in AdvanceToNextCategory method) 
        UsedWords.Add(word);
        AdvanceToNextCategory();

        return (true, "Valid word");
    }
}