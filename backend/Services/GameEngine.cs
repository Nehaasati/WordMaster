using WordMaster.Services;


namespace WordMaster.Services;

public class GameEngine
{
    private readonly WordValidator _validator;
    private readonly HashSet<string> _dictionary;
    private readonly Dictionary<string, List<string>> _categories;
    private static readonly string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";

    // Weighted randomizer weights (trying to mirror frontend randomizeer here)
    private static readonly Dictionary<char, int> Weights = new()
    {
        { 'A', 5 }, { 'E', 5 }, { 'I', 5 }, { 'O', 5 }, { 'U', 5 }, { 'Y', 5 }, { 'Å', 2 }, { 'Ä', 2 }, { 'Ö', 2 },
        { 'B', 3 }, { 'C', 1 }, { 'D', 3 }, { 'F', 2 }, { 'G', 3 }, { 'H', 3 }, { 'J', 2 }, { 'K', 4 }, { 'L', 4 },
        { 'M', 4 }, { 'N', 4 }, { 'P', 3 }, { 'R', 5 }, { 'S', 5 }, { 'T', 5 }, { 'V', 3 }, { 'W', 1 }, { 'X', 1 }, { 'Z', 1 }
    };

    public GameEngine(WordValidator validator, HashSet<string> dictionary, Dictionary<string, List<string>> categories)
    {
        _validator = validator;
        _dictionary = dictionary;
        _categories = categories;
    }

    public List<char> GenerateLetters(int count = 15)
    {
        var random = new Random();
        var letters = new List<char>();
        
        var weightedPool = new List<char>();
        foreach (var c in Alphabet)
        {
            int w = Weights.TryGetValue(c, out int weight) ? weight : 2;
            for (int i = 0; i < w; i++) weightedPool.Add(c);
        }

        for (int i = 0; i < count; i++)
        {
            letters.Add(weightedPool[random.Next(weightedPool.Count)]);
        }
        return letters;
    }

    public (bool IsValid, string Message) ValidateWord(string word, string category, List<char> availableLetters)
    {
        if (string.IsNullOrWhiteSpace(word))
            return (false, "Invalid request");

        if (!_validator.IsValidLength(word))
            return (false, "Too short");

        if (!_validator.IsValidCharacters(word))
            return (false, "Word contains invalid characters");

        // Check if word can be formed with available letters or nah
        if (!CanFormWord(word, availableLetters))
            return (false, "Word uses unavailable letters");

        bool inDictionary = _validator.IsInDictionary(word, _dictionary);
        bool inCategory = _validator.IsInCategory(word, category, _categories);

        if (!inDictionary || !inCategory)
            return (false, "Word not found");

        return (true, "Word found");
    }

    private bool CanFormWord(string word, List<char> availableLetters)
    {
        var tempLetters = new List<char>(availableLetters);
        foreach (var c in word.ToUpper())
        {
            if (!tempLetters.Contains(c))
                return false;
            tempLetters.Remove(c);
        }
        return true;
    }
}
